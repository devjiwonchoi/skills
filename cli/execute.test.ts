import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { type TestContext } from "node:test";

import { readState } from "./execute.ts";
import { next as implementation } from "./impl/state.ts";
import { run } from "./index.ts";
import { read, versions } from "./jsonl.ts";

function fixture({ context, revision }: { context: TestContext; revision: string | null }) {
  const root = mkdtempSync(join(tmpdir(), "jwn-execute-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  let counter = 0;
  const invoke = ({
    operation,
    payload,
    version,
    offset,
  }: {
    operation: "read" | "write" | "next";
    payload: unknown;
    version: number | undefined;
    offset: number | undefined;
  }) =>
    run({
      command: operation === "write" ? owner(payload) : "execute",
      root,
      session: "task",
      operation,
      payload,
      version,
      offset,
    });
  const record = (input: { type: string; [key: string]: unknown }) => {
    counter += 1;
    const payload = { id: `event-${counter}`, ...input };
    const result = invoke({
      operation: "write",
      payload,
      version: input.type === "start" ? undefined : 1,
      offset: undefined,
    });
    return { payload, result };
  };
  const state = () => {
    const directory = join(root, ".jwn/task/execute");
    const records = versions({ directory }).map(
      (name) => read({ path: join(directory, name), offset: 0 }).records,
    );
    const value = readState({ records, session: "task", version: undefined });
    const result = {
      state: {
        ...value.impl,
        round: 0,
        unresolvedP0P2: undefined,
        sections: undefined,
        ...implementation({ state: value.impl }),
        findings: [...[]],
        coverage: [...value.impl.coverage.values()],
      },
    };
    return result.state as {
      action: string;
      step: string | undefined;
      revision: string | null;
      round: number;
      implementing: boolean;
      findings: { id: string; evidence: string[]; status: string }[];
      unresolvedP0P2: { id: string }[] | undefined;
      sections: { id: string }[] | undefined;
      coverage: {
        section: { id: string };
        reviewedRevision: string | null;
        reason: string | null;
        evidence: string[];
      }[];
      verification: { outcome: string } | null;
    };
  };
  const path = join(root, ".jwn/task/execute/v1.jsonl");
  const start = record({
    type: "start",
    goal: "Improve installation",
    plan: "plan/v1.jsonl#approved-1",
    revision,
    scope: [
      { id: "input", path: "src/input.ts", behavior: "Input validation" },
      { id: "install", path: "src/install.ts", behavior: "Installation and rollback" },
    ],
  });
  const reconciliation = (retainInstall: boolean) => [
    { section_id: "input", retain: false, reason: "Changed input validation" },
    {
      section_id: "install",
      retain: retainInstall,
      reason: retainInstall
        ? "Installation behavior and dependency context are unchanged"
        : "Requires review",
    },
  ];
  const implemented = (target: string, retainInstall: boolean) => {
    record({ type: "impl_started" });
    return record({
      type: "implemented",
      previous_revision: state().revision,
      revision: target,
      coverage: reconciliation(retainInstall),
    });
  };
  const verified = (target: string) =>
    record({
      type: "verified",
      revision: target,
      outcome: "passed",
      evidence: [`checks-${target}.json`],
      gaps: [],
    });
  const pass = (findings: unknown[], reviewed: string[]) =>
    record({
      type: "review_pass",
      revision: state().revision,
      reviewer: "current-agent",
      outcome: "completed",
      findings,
      reviewed,
      evidence: ["review.json", "metadata.json"],
      gaps: [],
    });
  const finding = {
    id: "F1",
    section_id: "input",
    issue: "Invalid input reaches installer",
    priority: "P2",
    status: "open",
    evidence: ["case-a.json"],
  };
  return {
    root,
    rawState: () => {
      const directory = join(root, ".jwn/task/execute");
      return readState({
        records: versions({ directory }).map(
          (name) => read({ path: join(directory, name), offset: 0 }).records,
        ),
        session: "task",
        version: undefined,
      });
    },
    path,
    start,
    invoke,
    record,
    state,
    reconciliation,
    implemented,
    verified,
    pass,
    finding,
  };
}

function owner(value: unknown) {
  const type = value && typeof value === "object" && "type" in value ? value.type : null;
  if (type === "impl_started" || type === "implemented" || type === "verified") {
    return "impl";
  }
  if (type === "scope" || type === "review_pass") {
    return "review";
  }
  return "execute";
}

test("Journal retries retain original bytes across stage revision advances", (context) => {
  const task = fixture({ context, revision: null });
  const first = task.implemented("r1", false);
  task.implemented("r2", false);
  const before = readFileSync(task.path, "utf8");
  assert.deepEqual(
    task.invoke({ operation: "write", payload: first.payload, version: 1, offset: undefined }),
    first.result,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  assert.throws(
    () =>
      task.invoke({
        operation: "write",
        payload: { ...first.payload, revision: "conflict" },
        version: 1,
        offset: undefined,
      }),
    /conflicting/,
  );
});

test("Journal damage stops reads and writes for every stage", (context) => {
  const task = fixture({ context, revision: "r1" });
  appendFileSync(task.path, '{"type":');
  assert.throws(
    () =>
      task.invoke({ operation: "read", payload: undefined, version: undefined, offset: undefined }),
    /incomplete trailing/,
  );
  assert.throws(() => task.record({ type: "impl_started" }), /incomplete trailing/);
});

test("Quick-impl records implementation in the shared journal without claiming verification", (context) => {
  const task = fixture({ context, revision: null });
  task.record({ type: "impl_started" });
  assert.equal(task.state().implementing, true);
  task.record({
    type: "implemented",
    previous_revision: null,
    revision: "r1",
    coverage: task.reconciliation(false),
  });
  assert.equal(task.state().step, "verify");
  assert.equal(task.state().verification, null);
  assert.equal(existsSync(join(task.root, ".jwn/task/quick-impl")), false);
});

test("Impl rejects Review events and cannot retain uncovered scope", (context) => {
  const task = fixture({ context, revision: null });
  const before = readFileSync(task.path, "utf8");
  assert.throws(() =>
    run({
      command: "impl",
      root: task.root,
      session: "task",
      operation: "write",
      version: 1,
      offset: undefined,
      payload: {
        id: "foreign",
        type: "scope",
        revision: "r1",
        additions: [],
        reopen: ["input"],
        reason: "foreign",
      },
    }),
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.record({ type: "impl_started" });
  assert.throws(
    () =>
      task.record({
        type: "implemented",
        previous_revision: null,
        revision: "r1",
        coverage: task.reconciliation(true),
      }),
    /cannot retain uncovered/,
  );
});
