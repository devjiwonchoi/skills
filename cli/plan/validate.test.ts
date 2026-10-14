import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

import { run } from "../index.ts";

function fixture({ context, effort }: { context: TestContext; effort: "low" | "medium" | "high" }) {
  const root = mkdtempSync(join(tmpdir(), "jwn-plan-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
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

  return { root, write, read, path, first, start };
}

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
    { ...start, document: "v1.md" },
    { ...start, content_sha256: "a".repeat(64) },
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

test("Plan stores canonical Markdown and reads derive content without changing the log", (context) => {
  const { root, start, first, read, path } = fixture({ context, effort: "medium" });
  const document = join(root, ".jwn", "task", "plan", "v1.md");
  assert.equal(readFileSync(document, "utf8"), start.content);
  const saved = readFileSync(path, "utf8");
  const header = JSON.parse(saved);
  assert.equal(header.schema_version, 2);
  assert.equal(header.document, "v1.md");
  assert.equal(header.content_sha256, createHash("sha256").update(start.content).digest("hex"));
  assert.equal("content" in header, false);
  assert.deepEqual(header, first);
  assert.equal(read({ version: 1, offset: 0 }).records[0]?.content, start.content);
  assert.equal(readFileSync(path, "utf8"), saved);
});

test("Plan preserves Unicode bytes and rejects lossy text before publishing a candidate", (context) => {
  const { root, start, write, read } = fixture({ context, effort: "low" });
  const directory = join(root, ".jwn", "task", "plan");
  const candidate = { ...start, id: "p2", content: "# 계획 📝\r\nKeep exact bytes.\r\n" };
  const saved = write({ payload: candidate, version: undefined });
  assert.deepEqual(write({ payload: candidate, version: undefined }), saved);
  assert.equal(readFileSync(join(directory, "v2.md"), "utf8"), candidate.content);
  assert.equal(read({ version: 2, offset: 0 }).records[0]?.content, candidate.content);
  assert.throws(
    () =>
      write({
        payload: { ...start, id: "p3", content: "Unpaired surrogate: \uD800" },
        version: undefined,
      }),
    /well-formed Unicode/,
  );
  assert.equal(existsSync(join(directory, "v3.md")), false);
  assert.equal(existsSync(join(directory, "v3.jsonl")), false);
});

test("Plan document changes block reads, cursor reads and approval without altering history", (context) => {
  const { root, start, write, read, path } = fixture({ context, effort: "low" });
  const initial = read({ version: 1, offset: 0 });
  const before = readFileSync(path);
  writeFileSync(join(root, ".jwn", "task", "plan", "v1.md"), "Changed outside the recorder.");
  assert.throws(() => read({ version: 1, offset: 0 }), /hash mismatch/);
  assert.throws(() => read({ version: 1, offset: initial.nextOffset }), /hash mismatch/);
  assert.throws(
    () =>
      write({
        payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Approved." },
        version: 1,
      }),
    /hash mismatch/,
  );
  assert.throws(() => write({ payload: start, version: undefined }), /hash mismatch/);
  assert.deepEqual(readFileSync(path), before);
});

test("Plan rejects missing, redirected and duplicated document content", (context) => {
  const { root, read, path } = fixture({ context, effort: "low" });
  const document = join(root, ".jwn", "task", "plan", "v1.md");
  const content = readFileSync(document);
  const header = JSON.parse(readFileSync(path, "utf8"));
  for (const patch of [{ document: "../escape.md" }, { content: "Untrusted duplicate." }]) {
    writeFileSync(path, JSON.stringify({ ...header, ...patch }) + "\n");
    assert.throws(() => read({ version: 1, offset: 0 }), /invalid plan document/);
  }

  writeFileSync(path, JSON.stringify(header) + "\n");
  rmSync(document);
  assert.throws(() => read({ version: 1, offset: 0 }), /ENOENT/);
  const other = join(root, "other.md");
  writeFileSync(other, content);
  symlinkSync(other, document);
  assert.throws(() => read({ version: 1, offset: 0 }), /regular file/);
});

test("Plan revisions preserve prior Markdown and do not overwrite orphan documents", (context) => {
  const { root, start, write, path } = fixture({ context, effort: "low" });
  const directory = join(root, ".jwn", "task", "plan");
  const before = readFileSync(path);
  writeFileSync(join(directory, "v2.md"), "Preserve this orphan.");
  const next = { ...start, id: "p2", content: "Changed contract." };
  assert.throws(() => write({ payload: next, version: undefined }), /EEXIST/);
  assert.equal(readFileSync(join(directory, "v2.md"), "utf8"), "Preserve this orphan.");
  assert.equal(existsSync(join(directory, "v2.jsonl")), false);
  assert.deepEqual(readFileSync(path), before);
  rmSync(join(directory, "v2.md"));
  write({ payload: next, version: undefined });
  assert.equal(readFileSync(join(directory, "v1.md"), "utf8"), start.content);
  assert.equal(readFileSync(join(directory, "v2.md"), "utf8"), next.content);
});

test("Plan retains legacy embedded candidates through approval, retries and new versions", (context) => {
  const { root, start, write, read, path } = fixture({ context, effort: "low" });
  const header = JSON.parse(readFileSync(path, "utf8"));
  delete header.document;
  delete header.content_sha256;
  const legacy = { ...header, schema_version: 1, content: start.content };
  writeFileSync(path, JSON.stringify(legacy) + "\n");
  rmSync(join(root, ".jwn", "task", "plan", "v1.md"));
  assert.deepEqual(write({ payload: start, version: undefined }), legacy);
  assert.equal(read({ version: 1, offset: 0 }).records[0]?.content, start.content);
  write({
    payload: { id: "a1", type: "approved", candidate_id: "p1", value: "Approved." },
    version: 1,
  });
  const before = readFileSync(path);
  write({ payload: { ...start, id: "p2", content: "A changed contract." }, version: undefined });
  assert.deepEqual(readFileSync(path), before);
  assert.equal(existsSync(join(root, ".jwn", "task", "plan", "v1.md")), false);
  assert.equal(
    readFileSync(join(root, ".jwn", "task", "plan", "v2.md"), "utf8"),
    "A changed contract.",
  );
});
