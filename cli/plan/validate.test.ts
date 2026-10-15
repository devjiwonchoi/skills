import assert from "node:assert/strict";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

import { run } from "../index.ts";

function fixture({ context, effort }: { context: TestContext; effort: "low" | "medium" | "high" }) {
  const root = mkdtempSync(join(tmpdir(), "jwn-plan-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const alignWrite = ({
    payload,
    version,
  }: {
    payload: Record<string, unknown>;
    version: number | undefined;
  }) =>
    run({
      command: "align",
      root,
      session: "task",
      operation: "write",
      version,
      offset: undefined,
      payload,
    });
  for (const payload of [
    { id: "s1", type: "start", intention: "Preserve goal and contracts." },
    {
      id: "q1",
      type: "question",
      question: "Confirm the synthetic intention?",
      ambiguity_ids: [],
      confirms_intention: true,
    },
    {
      id: "r1",
      type: "response",
      question_id: "q1",
      value: "Synthetic confirmation.",
      confirms_intention: true,
    },
    { id: "aligned-1", type: "aligned" },
  ]) {
    alignWrite({ payload, version: payload.type === "start" ? undefined : 1 });
  }

  const write = ({
    payload,
    version,
  }: {
    payload: Record<string, unknown>;
    version: number | undefined;
  }) =>
    run({
      command: "plan",
      root,
      session: "task",
      operation: "write",
      version,
      offset: undefined,
      payload,
    });
  const start = {
    id: "p1",
    type: "start",
    effort,
    effort_reason: "Synthetic fixture.",
    alignment: { version: 1, event_id: "aligned-1" },
    content: "# Plan\nPreserve goal and contracts; local helpers may change.\n",
  };
  const first = write({ payload: start, version: undefined });
  const path = join(root, ".jwn", "task", "plan", "v1.jsonl");
  const read = ({
    version,
    offset,
  }: {
    version: number | undefined;
    offset: number | undefined;
  }) => {
    const result = run({
      command: "plan",
      root,
      session: "task",
      operation: "read",
      version,
      offset,
      payload: undefined,
    });
    assert.ok("records" in result && Array.isArray(result.records));

    return result as { records: Record<string, unknown>[]; version: number; nextOffset: number };
  };

  return { root, write, read, path, first, start, alignWrite };
}

test("Plan requires Align records from the same session before creating a candidate", (context) => {
  const { root, write, read, path, start } = fixture({ context, effort: "low" });
  const before = readFileSync(path);
  assert.throws(
    () =>
      run({
        command: "plan",
        root,
        session: "other",
        operation: "write",
        version: undefined,
        offset: undefined,
        payload: start,
      }),
    /Align records are required/,
  );
  assert.equal(existsSync(join(root, ".jwn", "other", "plan")), false);

  rmSync(join(root, ".jwn", "task", "align"), { recursive: true });
  assert.throws(
    () =>
      write({
        payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
        version: 1,
      }),
    /Align records are required/,
  );
  assert.deepEqual(readFileSync(path), before);
  assert.equal(read({ version: 1, offset: 0 }).records.length, 1);
});

test("Reopened Align blocks all Plan writes until a candidate pins the new confirmation", (context) => {
  const { write, read, path, start, alignWrite } = fixture({ context, effort: "low" });
  const before = readFileSync(path);
  alignWrite({
    payload: { id: "research", type: "research", value: "New evidence.", sources: ["source.ts"] },
    version: 1,
  });
  for (const payload of [
    { ...start, id: "p2", content: "Updated candidate." },
    { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
    {
      id: "review",
      type: "review",
      candidate_id: "p1",
      reviewer: "r",
      verdict: "approved",
      findings: [],
    },
  ]) {
    assert.throws(
      () => write({ payload, version: payload.type === "start" ? undefined : 1 }),
      /latest Align version must be aligned/,
    );
  }
  assert.deepEqual(readFileSync(path), before);
  assert.equal(read({ version: 1, offset: 0 }).records.length, 1);

  for (const payload of [
    {
      id: "q2",
      type: "question",
      question: "Confirm after the evidence?",
      ambiguity_ids: [],
      confirms_intention: true,
    },
    {
      id: "r2",
      type: "response",
      question_id: "q2",
      value: "Synthetic confirmation.",
      confirms_intention: true,
    },
    { id: "aligned-2", type: "aligned" },
  ]) {
    alignWrite({ payload, version: 1 });
  }
  for (const event_id of ["aligned-1", "s1", "missing"]) {
    assert.throws(
      () =>
        write({
          payload: {
            ...start,
            id: "p2",
            alignment: { version: 1, event_id },
            content: "Updated candidate.",
          },
          version: undefined,
        }),
      /latest aligned event/,
    );
  }
  assert.throws(
    () =>
      write({
        payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
        version: 1,
      }),
    /latest aligned event/,
  );
  assert.deepEqual(readFileSync(path), before);
  write({
    payload: {
      ...start,
      id: "p2",
      alignment: { version: 1, event_id: "aligned-2" },
      content: "Updated candidate.",
    },
    version: undefined,
  });
  assert.equal(read({ version: undefined, offset: 0 }).version, 2);
});

test("A new Align version supersedes earlier approval and must be confirmed before Plan", (context) => {
  const { write, path, start, alignWrite } = fixture({ context, effort: "low" });
  const before = readFileSync(path);
  alignWrite({
    payload: {
      id: "s2",
      type: "start",
      intention: "Preserve contracts and improve loading.",
      reason: "Synthetic scope change.",
      source: { version: 1, event_id: "aligned-1" },
    },
    version: undefined,
  });
  const candidate = { ...start, id: "p2", content: "Updated candidate." };
  assert.throws(
    () => write({ payload: candidate, version: undefined }),
    /latest Align version must be aligned/,
  );
  for (const payload of [
    {
      id: "q2",
      type: "question",
      question: "Confirm the new intention?",
      ambiguity_ids: [],
      confirms_intention: true,
    },
    {
      id: "r2",
      type: "response",
      question_id: "q2",
      value: "Synthetic confirmation.",
      confirms_intention: true,
    },
    { id: "aligned-2", type: "aligned" },
  ]) {
    alignWrite({ payload, version: 2 });
  }
  assert.throws(() => write({ payload: candidate, version: undefined }), /latest aligned event/);
  assert.deepEqual(readFileSync(path), before);
  const next = write({
    payload: { ...candidate, alignment: { version: 2, event_id: "aligned-2" } },
    version: undefined,
  });
  assert.equal(next.version, 2);
});

test("Plan rejects damaged or foreign Align history and an active Align writer", (context) => {
  for (const problem of ["sequence", "owner", "locked", "truncated"] as const) {
    const { root, write, path, start } = fixture({ context, effort: "low" });
    const before = readFileSync(path);
    const directory = join(root, ".jwn", "task", "align");
    const alignment = join(directory, "v1.jsonl");
    if (problem === "locked") {
      mkdirSync(join(directory, ".lock"));
    } else if (problem === "truncated") {
      appendFileSync(alignment, '{"id":"partial');
    } else {
      const records = readFileSync(alignment, "utf8")
        .trimEnd()
        .split("\n")
        .map((line) => JSON.parse(line));
      if (problem === "owner") {
        records[0].session_id = "other";
      } else {
        records.at(-1).seq = 99;
      }
      writeFileSync(alignment, records.map((record) => JSON.stringify(record)).join("\n") + "\n");
    }
    const damaged = readFileSync(alignment);
    assert.throws(
      () =>
        write({
          payload: { ...start, id: "p2", content: "Updated candidate." },
          version: undefined,
        }),
      /sequence gap|ownership|session is locked|incomplete trailing record/,
    );
    assert.deepEqual(readFileSync(path), before);
    assert.deepEqual(readFileSync(alignment), damaged);
  }
});

test("Plan records actual approval before detailed review at every effort", (context) => {
  for (const effort of ["low", "medium", "high"] as const) {
    const { write, read } = fixture({ context, effort });
    const review = {
      id: "r1",
      type: "review",
      candidate_id: "p1",
      reviewer: "reviewer-1",
      verdict: "approved",
      findings: [],
    };
    assert.throws(() => write({ payload: review, version: 1 }), /approval is required/);
    write({
      payload: {
        id: "a1",
        type: "approved",
        candidate_id: "p1",
        value: "Synthetic approval of candidate p1.",
      },
      version: 1,
    });
    write({ payload: review, version: 1 });
    assert.deepEqual(
      read({ version: 1, offset: 0 }).records.map((record) => record.type),
      ["start", "approved", "review"],
    );
  }
});

test("Plan candidate versions preserve prior approval but do not inherit it", (context) => {
  const { write, read, start, path } = fixture({ context, effort: "medium" });
  write({
    payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
    version: 1,
  });
  const before = readFileSync(path);
  const next = write({
    payload: { ...start, id: "p2", content: "# Revised plan\nChanged approach." },
    version: undefined,
  });
  assert.equal(next.version, 2);
  assert.deepEqual(readFileSync(path), before);
  assert.equal(read({ version: undefined, offset: 0 }).records.length, 1);
  assert.throws(
    () =>
      write({
        payload: {
          id: "r2",
          type: "review",
          candidate_id: "p2",
          reviewer: "reviewer-1",
          verdict: "approved",
          findings: [],
        },
        version: 2,
      }),
    /approval is required/,
  );
  assert.throws(
    () =>
      write({
        payload: { id: "a2", type: "approved", candidate_id: "p2", value: "Synthetic approval." },
        version: 1,
      }),
    /stale version/,
  );
  assert.throws(
    () =>
      write({
        payload: { id: "a2", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
        version: 2,
      }),
    /current candidate/,
  );
});

test("Plan retries preserve bytes and original recorder timestamps", (context) => {
  const { write, path, start, first } = fixture({ context, effort: "low" });
  const before = readFileSync(path);
  assert.deepEqual(write({ payload: start, version: undefined }), first);
  assert.deepEqual(readFileSync(path), before);
  assert.throws(
    () => write({ payload: { ...start, content: "conflict" }, version: undefined }),
    /conflicting candidate retry/,
  );
  assert.throws(
    () => write({ payload: { ...start, id: "p2" }, version: undefined }),
    /unchanged candidate/,
  );
  assert.deepEqual(readFileSync(path), before);
  const payload = { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." };
  const approved = write({ payload, version: 1 });
  const saved = readFileSync(path);
  assert.deepEqual(write({ payload, version: 1 }), approved);
  assert.throws(
    () => write({ payload: { ...payload, value: "Different." }, version: 1 }),
    /conflicting event retry/,
  );
  assert.deepEqual(readFileSync(path), saved);
});

test("Plan preserves adverse verdicts and later scoped fixes without erasing approval", (context) => {
  const { write, read } = fixture({ context, effort: "high" });
  write({
    payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
    version: 1,
  });
  write({
    payload: {
      id: "r1",
      type: "review",
      candidate_id: "p1",
      reviewer: "structure",
      verdict: "changes_requested",
      findings: ["Input X takes branch Y and loses Z."],
    },
    version: 1,
  });
  write({
    payload: {
      id: "r2",
      type: "review",
      candidate_id: "p1",
      reviewer: "structure",
      verdict: "approved",
      findings: [],
    },
    version: 1,
  });
  const records = read({ version: 1, offset: 0 }).records;
  assert.deepEqual(
    records.map((event) => event.type),
    ["start", "approved", "review", "review"],
  );
  assert.equal(records[2]?.verdict, "changes_requested");
  assert.equal(records[3]?.reviewer, records[2]?.reviewer);
  assert.equal(records[3]?.verdict, "approved");
});

test("Plan rejects malformed reviews and caller metadata without changing the log", (context) => {
  const { write, path, start } = fixture({ context, effort: "low" });
  const before = readFileSync(path);
  for (const payload of [
    { ...start, at: "fake" },
    { ...start, effort: "huge" },
    {
      id: "r1",
      type: "review",
      candidate_id: "p1",
      reviewer: "a",
      verdict: "changes_requested",
      findings: [],
    },
    {
      id: "r1",
      type: "review",
      candidate_id: "p1",
      reviewer: "a",
      verdict: "approved",
      findings: ["Unresolved blocker."],
    },
  ]) {
    assert.throws(() => write({ payload, version: 1 }));
  }
  assert.deepEqual(readFileSync(path), before);
});

test("Plan reads resume by byte offset and damaged history stops writes", (context) => {
  const { write, read, path } = fixture({ context, effort: "low" });
  const first = read({ version: 1, offset: 0 });
  write({
    payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Synthetic approval 한글." },
    version: 1,
  });
  const tail = read({ version: 1, offset: first.nextOffset });
  assert.deepEqual(
    tail.records.map((event) => event.type),
    ["approved"],
  );
  assert.deepEqual(read({ version: 1, offset: tail.nextOffset }).records, []);
  appendFileSync(path, '{"id":"partial');
  const damaged = readFileSync(path);
  assert.throws(
    () =>
      write({
        payload: { id: "a2", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
        version: 1,
      }),
    /incomplete trailing record/,
  );
  assert.deepEqual(readFileSync(path), damaged);
});

test("Plan rejects conflicting candidate IDs across version history before append", (context) => {
  const { root, write, start } = fixture({ context, effort: "low" });
  write({ payload: { ...start, id: "p2", content: "A different candidate." }, version: undefined });
  const path = join(root, ".jwn", "task", "plan", "v2.jsonl");
  const header = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, JSON.stringify({ ...header, id: "p1" }) + "\n");
  const before = readFileSync(path);

  assert.throws(
    () =>
      write({
        payload: { id: "a2", type: "approved", candidate_id: "p1", value: "Synthetic approval." },
        version: 2,
      }),
    /duplicate candidate ID/,
  );
  assert.deepEqual(readFileSync(path), before);
});
