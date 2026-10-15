import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { run } from "../index.ts";

test("current completion requires real unchanged evidence, while history and exact retries survive removed artifacts", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-evidence-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const call = (command: string, operation: "write" | "read" | "next", payload: unknown) =>
    run({
      command,
      operation,
      payload,
      root,
      session: "task",
      version:
        operation === "write" && (payload as { type: string }).type === "start" ? undefined : 1,
      offset: undefined,
    });
  call("iterate", "write", {
    id: "s",
    type: "start",
    goal: "Evidence",
    plan: null,
    revision: "r1",
    scope: [{ id: "a", path: "a.ts", behavior: "A" }],
  });
  const verified = {
    id: "v",
    type: "verified",
    revision: "r1",
    outcome: "passed",
    evidence: ["checks.json"],
    gaps: [],
  };
  assert.throws(() => call("impl", "write", verified), /ENOENT/);
  writeFileSync(join(root, "checks.json"), "passing checks at r1");
  const receipt = call("impl", "write", verified);
  writeFileSync(join(root, "review.json"), "review at r1");
  call("review", "write", {
    id: "review",
    type: "review_pass",
    revision: "r1",
    reviewer: "direct",
    outcome: "completed",
    reviewed: ["a"],
    findings: [],
    evidence: ["review.json"],
    gaps: [],
  });
  assert.equal(
    (call("iterate", "next", undefined) as { state: { action: string } }).state.action,
    "complete",
  );
  writeFileSync(join(root, "review.json"), "changed report");
  assert.equal(
    (call("iterate", "next", undefined) as { state: { action: string } }).state.action,
    "recover",
  );
  assert.throws(
    () => call("iterate", "write", { id: "done", type: "completed" }),
    /evidence changed/,
  );
  rmSync(join(root, "checks.json"));
  assert.deepEqual(call("impl", "write", verified), receipt);
  assert.ok(call("iterate", "read", undefined));
  const path = join(root, ".jwn/task/iterate/v1.jsonl");
  assert.match(readFileSync(path, "utf8"), /artifacts/);
});

test("legacy outcomes stay readable but need refreshed evidence for new completion", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-legacy-evidence-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const invoke = (command: string, operation: "read" | "write" | "next", payload: unknown) =>
    run({
      root,
      session: "task",
      command,
      operation,
      payload,
      version: (payload as { type?: string } | undefined)?.type === "start" ? undefined : 1,
      offset: undefined,
    });
  invoke("iterate", "write", {
    id: "s",
    type: "start",
    goal: "Legacy",
    plan: null,
    revision: "r1",
    scope: [{ id: "a", path: "a.ts", behavior: "A" }],
  });
  writeFileSync(join(root, "proof"), "old proof");
  invoke("impl", "write", {
    id: "v",
    type: "verified",
    revision: "r1",
    outcome: "passed",
    evidence: ["proof"],
    gaps: [],
  });
  invoke("review", "write", {
    id: "r",
    type: "review_pass",
    revision: "r1",
    reviewer: "direct",
    outcome: "completed",
    reviewed: ["a"],
    findings: [],
    evidence: ["proof"],
    gaps: [],
  });
  const path = join(root, ".jwn/task/iterate/v1.jsonl");
  const old =
    readFileSync(path, "utf8")
      .trimEnd()
      .split("\n")
      .map((line) => {
        const event = JSON.parse(line);
        delete event.artifacts;
        return JSON.stringify(event);
      })
      .join("\n") + "\n";
  writeFileSync(path, old);
  assert.ok(invoke("iterate", "read", undefined));
  assert.equal(
    (invoke("iterate", "next", undefined) as { state: { action: string } }).state.action,
    "recover",
  );
  assert.throws(
    () => invoke("iterate", "write", { id: "done", type: "completed" }),
    /captured artifacts/,
  );
  assert.equal(readFileSync(path, "utf8"), old);
});

test("retained review sections keep their original artifact integrity across correction", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-retained-evidence-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  let id = 0;
  const call = (command: string, payload: Record<string, unknown>) =>
    run({
      root,
      session: "task",
      command,
      operation: "write",
      payload: { id: `e-${++id}`, ...payload },
      version: payload.type === "start" ? undefined : 1,
      offset: undefined,
    });
  const next = () =>
    run({
      root,
      session: "task",
      command: "iterate",
      operation: "next",
      payload: undefined,
      version: 1,
      offset: undefined,
    }) as { state: { action: string } };
  for (const path of ["check-1", "review-1", "check-2", "review-2"]) {
    writeFileSync(join(root, path), path);
  }
  call("iterate", {
    type: "start",
    goal: "Retained review",
    plan: null,
    revision: "r1",
    scope: [
      { id: "a", path: "a.ts", behavior: "A" },
      { id: "b", path: "b.ts", behavior: "B" },
    ],
  });
  call("impl", {
    type: "verified",
    revision: "r1",
    outcome: "passed",
    evidence: ["check-1"],
    gaps: [],
  });
  const review = {
    type: "review_pass",
    reviewer: "direct",
    outcome: "completed",
    findings: [],
    gaps: [],
  };
  call("review", { ...review, revision: "r1", reviewed: ["a", "b"], evidence: ["review-1"] });
  call("impl", { type: "impl_started" });
  call("impl", {
    type: "implemented",
    previous_revision: "r1",
    revision: "r2",
    coverage: [
      { section_id: "a", retain: false, reason: "Changed" },
      { section_id: "b", retain: true, reason: "Unaffected" },
    ],
  });
  call("impl", {
    type: "verified",
    revision: "r2",
    outcome: "passed",
    evidence: ["check-2"],
    gaps: [],
  });
  call("review", { ...review, revision: "r2", reviewed: ["a"], evidence: ["review-2"] });
  assert.equal(next().state.action, "complete");
  writeFileSync(join(root, "review-1"), "changed retained report");
  assert.equal(next().state.action, "recover");
});
