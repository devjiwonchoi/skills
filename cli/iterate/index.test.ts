import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { type TestContext } from "node:test";

import { next as implementation } from "../impl/state.ts";
import { run } from "../index.ts";
import { context as review } from "../review/state.ts";
import { read, versions } from "../shared/journal.ts";
import { readState } from "./index.ts";

function fixture({ context, revision }: { context: TestContext; revision: string | null }) {
  const root = mkdtempSync(join(tmpdir(), "jwn-iterate-"));
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
      command: operation === "write" ? owner(payload) : "iterate",
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
    if (Array.isArray(input.evidence)) {
      for (const path of input.evidence as string[]) {
        if (!existsSync(join(root, path))) {
          writeFileSync(join(root, path), JSON.stringify({ artifact: path }) + "\n");
        }
      }
    }
    const result = invoke({
      operation: "write",
      payload,
      version: input.type === "start" ? undefined : 1,
      offset: undefined,
    });
    return { payload, result };
  };
  const state = () => {
    const directory = join(root, ".jwn/task/iterate");
    const records = versions({ directory }).map(
      (name) => read({ path: join(directory, name), offset: 0 }).records,
    );
    const value = readState({ records, session: "task", version: undefined });
    const result = {
      state: {
        ...value.impl,
        round: value.round,
        unresolvedP0P2: undefined,
        sections: undefined,
        ...implementation({ state: value.impl }),
        findings: [...value.review.findings.values()],
        coverage: [...value.review.coverage.values()],
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
  const path = join(root, ".jwn/task/iterate/v1.jsonl");
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
      const directory = join(root, ".jwn/task/iterate");
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
  return "iterate";
}

function loopFixture(input: { context: TestContext; revision: string | null }) {
  const task = fixture(input);
  return {
    ...task,
    state: () => {
      const result = task.invoke({
        operation: "next",
        payload: undefined,
        version: undefined,
        offset: undefined,
      });
      assert.ok("state" in result);
      return result.state as ReturnType<typeof task.state>;
    },
  };
}

test("Iterate groups deduplicated findings and retains unaffected coverage after correction", (context) => {
  const task = loopFixture({ context, revision: null });
  assert.equal(task.state().step, "quick-impl");
  task.record({ type: "iteration", round: 1, findings: [] });
  task.implemented("r1", false);
  assert.equal(task.state().step, "verify");
  task.verified("r1");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["input", "install"],
  );
  task.pass([task.finding], ["input", "install"]);
  assert.equal(task.state().action, "impl");
  assert.equal(task.state().step, "quick-impl");
  assert.deepEqual(
    task.state().unresolvedP0P2?.map((finding) => finding.id),
    ["F1"],
  );
  assert.equal(task.state().findings.length, 1);
  assert.deepEqual(task.state().findings[0]?.evidence, ["case-a.json"]);

  task.record({ type: "iteration", round: 2, findings: ["F1"] });
  task.implemented("r2", true);
  assert.equal(task.state().verification, null);
  assert.equal(task.state().findings[0]?.status, "open");
  task.verified("r2");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["input"],
  );
  const retained = task.state().coverage.find((item) => item.section.id === "install");
  assert.equal(retained?.reviewedRevision, "r1");
  assert.deepEqual(retained?.evidence, ["review.json", "metadata.json"]);
  assert.ok(retained?.reason);
  task.pass([{ ...task.finding, status: "resolved", evidence: ["fix-r2.json"] }], ["input"]);
  assert.equal(task.state().action, "complete");
  task.record({ type: "completed" });
});

test("One direct pass returns P0–P2 for correction immediately, retaining uncovered scope", (context) => {
  for (const priority of ["P0", "P1", "P2"]) {
    const task = loopFixture({ context, revision: "r1" });
    task.verified("r1");
    task.pass([{ ...task.finding, priority }], ["input"]);
    assert.equal(task.state().action, "impl");
    assert.equal(task.state().step, "quick-impl");
    assert.equal(
      task.state().coverage.find((item) => item.section.id === "install")?.reviewedRevision,
      null,
    );
    assert.throws(() => task.record({ type: "completed" }), /not complete/);
    assert.deepEqual(
      task.state().unresolvedP0P2?.map((finding) => finding.id),
      ["F1"],
    );
    task.record({ type: "iteration", round: 1, findings: ["F1"] });
    task.implemented("r2", false);
    task.verified("r2");
    task.pass([{ ...task.finding, priority, status: "resolved" }], ["input"]);
    assert.equal(task.state().action, "review");
    assert.deepEqual(
      task.state().sections?.map((section) => section.id),
      ["install"],
    );
    task.pass([], ["install"]);
    assert.equal(task.state().action, "complete");
  }
});

test("Repeated evidence updates a retained finding without requiring another discovery pass", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([task.finding], ["input", "install"]);
  task.pass([{ ...task.finding, evidence: ["case-b.json"] }], ["input"]);
  assert.equal(task.state().action, "impl");
  assert.equal(task.state().findings.length, 1);
  assert.deepEqual(task.state().findings[0]?.evidence, ["case-a.json", "case-b.json"]);
});

test("Exact retries survive revision advance; stale new events and conflicting retries do not append", (context) => {
  const task = loopFixture({ context, revision: null });
  task.implemented("r1", false);
  const verification = task.verified("r1");
  task.pass([], ["input", "install"]);
  task.implemented("r2", true);
  const before = readFileSync(task.path, "utf8");
  assert.deepEqual(
    task.invoke({
      operation: "write",
      payload: verification.payload,
      version: 1,
      offset: undefined,
    }),
    verification.result,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  assert.throws(
    () =>
      task.record({
        type: "verified",
        revision: "r1",
        outcome: "passed",
        evidence: ["old.json"],
        gaps: [],
      }),
    /reconciliation|previous_revision/,
  );
  assert.throws(
    () =>
      task.invoke({
        operation: "write",
        payload: { ...verification.payload, evidence: ["different.json"] },
        version: 1,
        offset: undefined,
      }),
    /conflicting/,
  );
  assert.throws(
    () =>
      task.record({
        type: "review_pass",
        revision: "r1",
        reviewer: "reviewer",
        outcome: "completed",
        reviewed: ["input"],
        findings: [],
        evidence: ["review.json"],
        gaps: [],
      }),
    /current completed revision/,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
});

test("Revision reconciliation is explicit, complete, and cannot retain uncovered scope", (context) => {
  const task = loopFixture({ context, revision: null });
  task.record({ type: "impl_started" });
  const before = readFileSync(task.path, "utf8");
  for (const coverage of [[], task.reconciliation(false).slice(0, 1), task.reconciliation(true)]) {
    assert.throws(
      () => task.record({ type: "implemented", previous_revision: null, revision: "r1", coverage }),
      /reconciliation|retain uncovered/,
    );
  }
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.record({
    type: "implemented",
    previous_revision: null,
    revision: "r1",
    coverage: task.reconciliation(false),
  });
  task.verified("r1");
  task.pass([], ["input", "install"]);
  assert.equal(task.state().action, "complete");
  task.record({
    type: "verified",
    revision: "r2",
    previous_revision: "r1",
    coverage: task.reconciliation(true),
    outcome: "passed",
    evidence: ["checks-r2.json"],
    gaps: [],
  });
  assert.equal(task.state().action, "review");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["input"],
  );
});

test("Known findings cannot be duplicated, silently closed, or repurposed", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([task.finding], ["input", "install"]);
  const before = readFileSync(task.path, "utf8");
  assert.throws(() => task.pass([{ ...task.finding, id: "F2" }], ["input"]), /reuse the existing/);
  assert.throws(
    () => task.pass([{ ...task.finding, issue: "Different failure" }], ["input"]),
    /retain its issue/,
  );
  assert.throws(
    () => task.pass([{ ...task.finding, status: "resolved" }], ["install"]),
    /require review of their section/,
  );
  assert.throws(() => task.record({ type: "completed" }), /not complete/);
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.pass([], ["input"]);
  assert.equal(task.state().findings[0]?.status, "open");
  assert.equal(task.state().step, "quick-impl");
  task.pass(
    [{ ...task.finding, status: "dismissed", evidence: ["counterexample.json"] }],
    ["input"],
  );
  assert.equal(task.state().action, "complete");
  task.pass([task.finding], ["input"]);
  assert.equal(task.state().findings.length, 1);
  assert.equal(task.state().action, "impl");
});

test("A distinct failure at the same section is retained as a separate finding", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass(
    [task.finding, { ...task.finding, id: "F2", issue: "Installer retry loses rollback state" }],
    ["input", "install"],
  );
  assert.equal(task.state().action, "impl");
  assert.equal(task.state().findings.length, 2);
  assert.throws(() => task.record({ type: "iteration", round: 1, findings: ["F1"] }), /retain all/);
  task.record({ type: "iteration", round: 1, findings: ["F1", "F2"] });
});

test("Missing verification evidence, review gaps and interrupted implementation stay incomplete", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  assert.throws(
    () =>
      task.record({ type: "verified", revision: "r1", outcome: "passed", evidence: [], gaps: [] }),
    /passed verification/,
  );
  task.record({
    type: "verified",
    revision: "r1",
    outcome: "incomplete",
    evidence: [],
    gaps: ["Runtime check unavailable"],
  });
  assert.equal(task.state().action, "recover");
  task.verified("r1");
  assert.throws(
    () =>
      task.record({
        type: "review_pass",
        revision: "r1",
        reviewer: "reviewer",
        outcome: "incomplete",
        reviewed: ["input"],
        findings: [],
        evidence: [],
        gaps: ["Denied diff access"],
      }),
    /incomplete review/,
  );
  task.record({
    type: "review_pass",
    revision: "r1",
    reviewer: "reviewer",
    outcome: "incomplete",
    reviewed: [],
    findings: [],
    evidence: [],
    gaps: ["Denied diff access"],
  });
  assert.equal(task.state().action, "recover");
  assert.ok(task.state().coverage.every((item) => item.reviewedRevision === null));
  task.pass([], ["input", "install"]);
  assert.equal(task.state().action, "complete");
  task.record({ type: "impl_started" });
  assert.equal(task.state().step, "quick-impl");
  assert.throws(() => task.verified("r1"), /implementation outcome/);
});

test("P3 findings do not restart implementation, but uncovered scope still needs review", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([{ ...task.finding, priority: "P3" }], ["input"]);
  assert.equal(task.state().action, "review");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["install"],
  );
  task.pass([], ["install"]);
  assert.equal(task.state().action, "complete");
  task.record({
    type: "scope",
    revision: "r1",
    additions: [
      { id: "telemetry", path: "src/telemetry.ts", behavior: "Telemetry during failure" },
    ],
    reopen: ["input"],
    reason: "Discovery exposes an unreviewed interaction",
  });
  assert.equal(task.state().action, "review");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["input", "telemetry"],
  );
});

test("Blocker resolution preserves missing evidence and invalid transitions do not write", (context) => {
  const task = loopFixture({ context, revision: null });
  task.record({ type: "blocked", reason: "Plan boundary needs a decision" });
  assert.equal(task.state().action, "blocked");
  assert.throws(() => task.record({ type: "impl_started" }), /resolve the recorded blocker/);
  task.record({ type: "resumed", reason: "The user approved the bounded correction" });
  assert.equal(task.state().step, "quick-impl");
  assert.throws(
    () =>
      task.record({
        type: "implemented",
        previous_revision: null,
        revision: "r1",
        coverage: task.reconciliation(false),
      }),
    /implementation start/,
  );
  task.record({ type: "iteration", round: 1, findings: [] });
  task.implemented("r1", false);
  assert.throws(
    () => task.record({ type: "iteration", round: 2, findings: [] }),
    /implementation work from next/,
  );
  assert.throws(
    () => task.invoke({ operation: "next", payload: undefined, version: undefined, offset: 0 }),
    /only supported by read/,
  );
});

test("next and read reject damaged or semantically tampered history", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  const valid = readFileSync(task.path, "utf8");
  appendFileSync(task.path, '{"type":');
  assert.throws(() => task.state(), /incomplete trailing/);
  assert.throws(
    () =>
      task.invoke({
        operation: "read",
        payload: undefined,
        version: 1,
        offset: Buffer.byteLength(valid),
      }),
    /incomplete trailing/,
  );
  writeFileSync(task.path, valid);
  const tampered = valid
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  tampered[1]!.seq = 99;
  writeFileSync(task.path, tampered.map((event) => JSON.stringify(event)).join("\n") + "\n");
  assert.throws(() => task.state(), /sequence gap/);
  assert.throws(() => task.verified("r1"), /sequence gap/);
});

test("Plan successors create versions explicitly; old exact retries remain safe and next rejects stale versions", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  const result = task.verified("r1");
  assert.throws(
    () =>
      task.record({
        type: "start",
        goal: "Improve installation",
        plan: "plan/v1.jsonl#approved-1",
        revision: null,
        scope: [{ id: "input", path: "src/input.ts", behavior: "Input validation" }],
        reason: "Reset",
      }),
    /changed approved plan/,
  );
  const successor = task.record({
    type: "start",
    goal: "Improve installation",
    plan: "plan/v2.jsonl#approved-2",
    revision: null,
    scope: [
      { id: "input", path: "src/input.ts", behavior: "Input validation" },
      { id: "install", path: "src/install.ts", behavior: "Installation and rollback" },
    ],
    reason: "Approved approach changed",
  });
  assert.ok("version" in successor.result);
  assert.equal(successor.result.version, 2);
  assert.equal(task.state().step, "quick-impl");
  assert.throws(
    () => task.invoke({ operation: "next", payload: undefined, version: 1, offset: undefined }),
    /stale version/,
  );
  assert.deepEqual(
    task.invoke({ operation: "write", payload: result.payload, version: 1, offset: undefined }),
    result.result,
  );
});

test("A deliberate return to earlier content requires a current predecessor and fresh evidence", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([], ["input", "install"]);
  task.implemented("r2", false);
  task.verified("r2");
  const before = readFileSync(task.path, "utf8");
  assert.throws(
    () =>
      task.record({
        type: "verified",
        previous_revision: "r1",
        revision: "r3",
        coverage: task.reconciliation(false),
        outcome: "passed",
        evidence: ["stale-check.json"],
        gaps: [],
      }),
    /current previous_revision/,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.implemented("r1", false);
  assert.equal(task.state().revision, "r1");
  assert.equal(task.state().step, "verify");
  assert.equal(task.state().verification, null);
  assert.ok(task.state().coverage.every((item) => item.reviewedRevision === null));
});

test("A new revision with all coverage retained still gives the next direct review a scope", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([], ["input", "install"]);
  task.record({
    type: "verified",
    revision: "r2",
    previous_revision: "r1",
    outcome: "passed",
    evidence: ["checks-r2.json"],
    gaps: [],
    coverage: [
      { section_id: "input", retain: true, reason: "Input behavior and dependencies unchanged" },
      {
        section_id: "install",
        retain: true,
        reason: "Installation behavior and dependencies unchanged",
      },
    ],
  });
  assert.equal(task.state().action, "review");
  assert.deepEqual(
    task.state().sections?.map((section) => section.id),
    ["input", "install"],
  );
  task.pass([], ["input", "install"]);
  assert.equal(task.state().action, "complete");
});

test("Plan successors retain unresolved findings and evidence, reopening all required scope", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([task.finding], ["input", "install"]);
  const before = readFileSync(task.path, "utf8");
  const successor = {
    type: "start" as const,
    goal: "Improve installation",
    plan: "plan/v2.jsonl#approved-2",
    revision: "r2",
    scope: [
      { id: "input", path: "src/input.ts", behavior: "Input validation" },
      { id: "install", path: "src/install.ts", behavior: "Installation and rollback" },
    ],
    reason: "Approved approach changed",
  };
  assert.throws(
    () => task.record({ ...successor, scope: successor.scope.slice(1) }),
    /retain existing review sections/,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.record(successor);
  assert.deepEqual(task.state().findings, [task.finding]);
  assert.ok(
    task
      .state()
      .coverage.every((item) => item.reviewedRevision === null && item.evidence.length > 0),
  );
  const write = (payload: unknown) =>
    task.invoke({ operation: "write", payload, version: 2, offset: undefined });
  for (const path of ["checks-r2.json", "review-2.json", "review-fixed.json"]) {
    writeFileSync(join(task.root, path), "synthetic successor evidence\n");
  }
  write({
    id: "checks-2",
    type: "verified",
    revision: "r2",
    outcome: "passed",
    evidence: ["checks-r2.json"],
    gaps: [],
  });
  write({
    id: "review-2",
    type: "review_pass",
    revision: "r2",
    reviewer: "current-agent",
    outcome: "completed",
    reviewed: ["input", "install"],
    findings: [],
    evidence: ["review-2.json"],
    gaps: [],
  });
  assert.equal(task.state().step, "quick-impl");
  assert.deepEqual(
    task.state().unresolvedP0P2?.map((item) => item.id),
    ["F1"],
  );
  assert.throws(() => write({ id: "done-too-early", type: "completed" }), /not complete/);
  write({
    id: "resolved-2",
    type: "review_pass",
    revision: "r2",
    reviewer: "current-agent",
    outcome: "completed",
    reviewed: ["input"],
    findings: [{ ...task.finding, status: "resolved", evidence: ["fixed-r2.json"] }],
    evidence: ["review-fixed.json"],
    gaps: [],
  });
  assert.equal(task.state().action, "complete");
  assert.deepEqual(task.state().findings[0]?.evidence, ["case-a.json", "fixed-r2.json"]);
});

test("Authorized follow-up resumes completed execution, and interrupted rounds cannot multiply", (context) => {
  const task = loopFixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([], ["input", "install"]);
  task.record({ type: "completed" });
  assert.throws(
    () => task.record({ type: "iteration", round: 1, findings: [] }),
    /follow-up with a reason/,
  );
  task.record({
    type: "iteration",
    round: 1,
    findings: [],
    reason: "User authorized delivery fix-up",
  });
  assert.equal(task.state().implementing, true);
  const before = readFileSync(task.path, "utf8");
  assert.throws(
    () => task.record({ type: "iteration", round: 2, findings: [] }),
    /resume the current/,
  );
  assert.equal(readFileSync(task.path, "utf8"), before);
  task.implemented("r2", false);
  task.verified("r2");
  task.pass([], ["input", "install"]);
  assert.equal(task.state().action, "complete");
});

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

test("Verify requires completed implementation and evidence for a passed outcome", (context) => {
  const task = fixture({ context, revision: null });
  task.record({ type: "impl_started" });
  assert.throws(() => task.verified("r1"), /implementation outcome/);
  task.record({
    type: "implemented",
    previous_revision: null,
    revision: "r1",
    coverage: task.reconciliation(false),
  });
  assert.throws(
    () =>
      task.record({ type: "verified", revision: "r1", outcome: "passed", evidence: [], gaps: [] }),
    /passed verification/,
  );
  task.record({
    type: "verified",
    revision: "r1",
    outcome: "failed",
    evidence: [],
    gaps: ["Runtime failure"],
  });
  assert.equal(task.state().action, "blocked");
  task.verified("r1");
  assert.equal(task.state().action, "complete");
});

test("Verify reconciles its own code fixes against the current predecessor", (context) => {
  const task = fixture({ context, revision: "r1" });
  assert.throws(
    () =>
      task.record({
        type: "verified",
        revision: "r2",
        outcome: "passed",
        evidence: ["checks.json"],
        gaps: [],
      }),
    /previous_revision/,
  );
  task.record({
    type: "verified",
    previous_revision: "r1",
    revision: "r2",
    coverage: task.reconciliation(false),
    outcome: "passed",
    evidence: ["checks.json"],
    gaps: [],
  });
  assert.equal(task.state().revision, "r2");
  assert.ok(task.state().coverage.every((item) => item.reviewedRevision === null));
});

test("Review owns stable findings, evidence and explicit dispositions", (context) => {
  const task = fixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([task.finding], ["input", "install"]);
  assert.throws(
    () => task.pass([{ ...task.finding, id: "other" }], ["input"]),
    /reuse the existing/,
  );
  assert.throws(
    () => task.pass([{ ...task.finding, status: "resolved" }], ["install"]),
    /require review of their section/,
  );
  task.pass([{ ...task.finding, evidence: ["second.json"] }], ["input"]);
  assert.deepEqual(review({ state: task.rawState().review }).findings[0]?.evidence, [
    "case-a.json",
    "second.json",
  ]);
  task.pass([{ ...task.finding, status: "resolved", evidence: ["fixed.json"] }], ["input"]);
  assert.equal(review({ state: task.rawState().review }).unresolvedP0P2.length, 0);
});

test("Review reuses unaffected coverage, rejects invalid scope and never accepts incomplete coverage", (context) => {
  const task = fixture({ context, revision: "r1" });
  task.verified("r1");
  task.pass([], ["input", "install"]);
  task.implemented("r2", true);
  assert.deepEqual(
    review({ state: task.rawState().review }).sections.map((section) => section.id),
    ["input"],
  );
  assert.throws(
    () =>
      task.record({
        type: "scope",
        revision: "r2",
        additions: [],
        reopen: ["missing"],
        reason: "new context",
      }),
    /unknown reopened/,
  );
  task.record({
    type: "review_pass",
    revision: "r2",
    reviewer: "current-agent",
    outcome: "incomplete",
    reviewed: [],
    findings: [],
    evidence: [],
    gaps: ["Unavailable source"],
  });
  assert.equal(review({ state: task.rawState().review }).pass?.outcome, "incomplete");
  assert.equal(
    task.state().coverage.find((item) => item.section.id === "input")?.reviewedRevision,
    null,
  );
});
