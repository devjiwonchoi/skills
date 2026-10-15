import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test, type TestContext } from "node:test";

import { run } from "../index.ts";

const head = "a".repeat(40),
  base = "b".repeat(40),
  changed = "c".repeat(40);
const pr = "https://github.com/owner/repo/pull/1";
const target = {
  url: pr,
  head,
  base: "main",
  base_sha: base,
  required_checks: ["test"],
  expected_bots: ["review-bot"],
};
function fixture(context: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "jwn-ship-"));
  const bin = join(root, "bin"),
    remote = join(root, "remote.json");
  mkdirSync(bin);
  const oldPath = process.env.PATH;
  process.env.PATH = `${bin}${delimiter}${oldPath}`;
  context.after(() => {
    process.env.PATH = oldPath;
    rmSync(root, { recursive: true, force: true });
  });
  const initial = { head, base, checks: "success", bot: true, calls: [] };
  writeFileSync(remote, JSON.stringify(initial));
  // Every remote request is a fixture; this suite never writes to GitHub.
  writeFileSync(
    join(bin, "gh"),
    `#!${process.execPath}
const fs=require('node:fs');
const path=${JSON.stringify(remote)}, d=JSON.parse(fs.readFileSync(path));
const a=process.argv.slice(2); d.calls.push(a); fs.writeFileSync(path,JSON.stringify(d));
const endpoint=a.at(-1), emit=v=>process.stdout.write(JSON.stringify(v));
if(d.error){process.stderr.write('read denied');process.exit(1);}
if(a.includes('graphql')) emit({data:{repository:{pullRequest:{reviewThreads:{nodes:d.threads||[],pageInfo:{hasNextPage:false,endCursor:null}}}}}});
else if(endpoint.includes('/pulls/') && !endpoint.includes('/reviews')) {
 const n=endpoint.split('/').at(-1), reads=d.calls.filter(x=>x.at(-1)===endpoint).length;
 emit({html_url:'https://github.com/owner/repo/pull/'+n,state:d.closed?'closed':'open',draft:!!d.draft,head:{sha:d.changeDuringRead&&reads%2===0?'${changed}':d.head,ref:'fix'},base:{sha:d.base,ref:'main'}});
} else if(endpoint.includes('/check-runs')) emit([{total_count:d.incomplete?2:1,check_runs:[{id:1,name:'test',status:d.checks==='pending'?'in_progress':'completed',conclusion:d.checks==='pending'?null:d.checks,app:{id:1}}]}]);
else if(endpoint.includes('/statuses?')) emit([[]]);
else if(endpoint.includes('/reviews?')) emit([d.reviews || (d.bot?[{id:1,state:'COMMENTED',commit_id:d.head,user:{login:'review-bot'}}]:[])]);
else {process.stderr.write('unexpected fixture request: '+JSON.stringify(a));process.exit(1);}
`,
    { mode: 0o755 },
  );
  let count = 0;
  const invoke = (command: string, operation: "write" | "read" | "next", payload: unknown) =>
    run({
      command,
      operation,
      payload,
      root,
      session: "task",
      version: (payload as { type?: string } | undefined)?.type === "start" ? undefined : 1,
      offset: undefined,
    });
  const write = (payload: Record<string, unknown>) =>
    invoke("ship", "write", { id: `ship-${++count}`, ...payload });
  const next = () => (invoke("ship", "next", undefined) as { state: { action: string } }).state;
  const update = (value: Record<string, unknown>) =>
    writeFileSync(
      remote,
      JSON.stringify({ ...JSON.parse(readFileSync(remote, "utf8")), ...value }),
    );
  writeFileSync(join(root, "proof.json"), "executed checks and direct review for r1\n");
  invoke("iterate", "write", {
    id: "e",
    type: "start",
    goal: "Ship",
    plan: null,
    revision: "r1",
    scope: [{ id: "a", path: "a.ts", behavior: "A" }],
  });
  invoke("impl", "write", {
    id: "v",
    type: "verified",
    revision: "r1",
    outcome: "passed",
    evidence: ["proof.json"],
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
    evidence: ["proof.json"],
    gaps: [],
  });
  write({
    type: "start",
    goal: "Ship",
    authorization: "Synthetic instruction authorizes scoped push, PR creation and repairs.",
  });
  return { root, remote, invoke, write, next, update };
}

test("lost push/create receipts reconcile before another mutation and exact retries never call GitHub", (context) => {
  const f = fixture(context);
  const started = f.write({
    id: "push",
    type: "attempt",
    operation: "push",
    target: "owner/repo:fix",
    expected_head: head,
  });
  assert.equal(f.next().action, "reconcile");
  assert.throws(
    () => f.write({ type: "attempt", operation: "create_pr", target: pr, expected_head: head }),
    /reconcile/,
  );
  f.write({ type: "result", attempt_id: "push", outcome: "uncertain", evidence: ["proof.json"] });
  assert.throws(
    () =>
      f.write({
        type: "result",
        attempt_id: "push",
        outcome: "succeeded",
        evidence: ["proof.json"],
      }),
    /reconciliation/,
  );
  f.write({
    type: "result",
    attempt_id: "push",
    outcome: "succeeded",
    evidence: ["proof.json"],
    reconciled: true,
  });
  f.write({
    id: "create",
    type: "attempt",
    operation: "create_pr",
    target: pr,
    expected_head: head,
  });
  f.write({
    type: "result",
    attempt_id: "create",
    outcome: "succeeded",
    evidence: ["proof.json"],
    reconciled: true,
  });
  assert.deepEqual(
    f.write({
      id: "push",
      type: "attempt",
      operation: "push",
      target: "owner/repo:fix",
      expected_head: head,
    }),
    started,
  );
  assert.equal(JSON.parse(readFileSync(f.remote, "utf8")).calls.length, 0);
  assert.throws(
    () => f.write({ type: "attempt", operation: "create_pr", target: pr, expected_head: head }),
    /new-work reason/,
  );
});

test("pending CI and expected bot review keep Ship active; readiness refresh detects later head changes", (context) => {
  const f = fixture(context);
  f.write({ type: "targets", revision: "r1", pull_requests: [target] });
  f.update({ checks: "pending" });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "wait");
  assert.throws(() => f.write({ type: "ready" }), /not ready/);
  f.update({ checks: "success", bot: false });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "wait");
  f.update({ bot: true });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "ready");
  f.write({ type: "ready" });
  assert.equal(f.next().action, "complete");
  rmSync(join(f.root, "proof.json"));
  assert.equal(f.next().action, "recover");
  writeFileSync(join(f.root, "proof.json"), "executed checks and direct review for r1\n");
  f.update({ head: changed });
  assert.equal(f.next().action, "reconcile");
  assert.throws(() => f.write({ type: "ready" }), /not ready/);
});

test("new publication invalidates observations and known failed retries require a corrected cause", (context) => {
  const f = fixture(context);
  f.write({ type: "targets", revision: "r1", pull_requests: [target] });
  f.write({ type: "observed" });
  f.write({ id: "push", type: "attempt", operation: "push", target: pr, expected_head: head });
  assert.equal(f.next().action, "reconcile");
  f.write({ type: "result", attempt_id: "push", outcome: "failed", evidence: ["proof.json"] });
  assert.equal(f.next().action, "observe");
  assert.throws(
    () => f.write({ type: "attempt", operation: "push", target: pr, expected_head: head }),
    /corrected cause/,
  );
  f.write({
    type: "attempt",
    operation: "push",
    target: pr,
    expected_head: head,
    retry_of: "push",
    reason: "The confirmed transient transport failure cleared.",
  });
});

test("readiness needs current execution, intact artifacts and every PR's current base and review state", (context) => {
  const f = fixture(context);
  f.write({ type: "targets", revision: "old", pull_requests: [target] });
  assert.throws(() => f.write({ type: "ready" }), /current delivery revision/);
  f.write({
    type: "targets",
    revision: "r1",
    pull_requests: [target, { ...target, url: "https://github.com/owner/repo/pull/2" }],
  });
  f.update({ threads: [{ isResolved: false, isOutdated: false }] });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "repair");
  f.update({ threads: [], base: changed });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "reconcile");
  f.update({ base });
  writeFileSync(join(f.root, "proof.json"), "tampered report");
  assert.throws(() => f.write({ type: "ready" }), /evidence changed/);
  assert.ok(f.invoke("ship", "read", undefined));
});

test("incomplete pages and concurrent head changes never establish readiness", (context) => {
  const f = fixture(context);
  f.write({ type: "targets", revision: "r1", pull_requests: [target] });
  f.update({ incomplete: true });
  assert.throws(() => f.write({ type: "observed" }), /incomplete check-run pages/);
  f.update({ incomplete: false, changeDuringRead: true });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "reconcile");
  f.update({ changeDuringRead: false, error: true });
  assert.throws(() => f.write({ type: "ready" }), /read denied/);
});

test("a later commented review does not erase an effective change request", (context) => {
  const f = fixture(context);
  f.write({ type: "targets", revision: "r1", pull_requests: [{ ...target, expected_bots: [] }] });
  f.update({
    reviews: [
      { id: 1, state: "CHANGES_REQUESTED", commit_id: head, user: { login: "human" } },
      { id: 2, state: "COMMENTED", commit_id: head, user: { login: "human" } },
    ],
  });
  f.write({ type: "observed" });
  assert.equal(f.next().action, "repair");
  assert.throws(() => f.write({ type: "ready" }), /not ready/);
});

test("a successor Plan invalidates readiness even when the old execution and PR remain green", (context) => {
  const f = fixture(context);
  const command = (name: string, payload: Record<string, unknown>) =>
    run({
      command: name,
      operation: "write",
      payload,
      root: f.root,
      session: "task",
      version: payload.type === "start" ? undefined : 1,
      offset: undefined,
    });
  command("align", {
    id: "intent",
    type: "start",
    prompt: "Ship the approved change",
    intention: "Ship the approved change",
  });
  command("align", {
    id: "aligned",
    type: "aligned",
    source: { version: 1, event_id: "intent" },
    reason: "Synthetic clear request",
  });
  const candidate = {
    id: "plan",
    type: "start",
    alignment: { version: 1, event_id: "aligned" },
    effort: "low",
    effort_reason: "Synthetic",
    content: "Approved implementation and verification methods",
  };
  command("plan", candidate);
  command("plan", {
    id: "approved",
    type: "approved",
    candidate_id: "plan",
    value: "Synthetic final approval",
  });
  const path = join(f.root, ".jwn/task/iterate/v1.jsonl");
  const events = readFileSync(path, "utf8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line));
  events[0].plan = "plan/v1.jsonl#plan";
  writeFileSync(path, events.map((event) => JSON.stringify(event)).join("\n") + "\n");
  f.write({ type: "targets", revision: "r1", pull_requests: [target] });
  f.write({ type: "ready" });
  assert.equal(f.next().action, "complete");
  command("plan", { ...candidate, id: "new-plan", content: "Changed verification requirements" });
  assert.equal(f.next().action, "recover");
  assert.throws(() => f.write({ type: "ready" }), /stale version|current Plan/);
});
