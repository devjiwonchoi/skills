import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { run as execute } from "../index.ts";
import type { Event } from "./schema.ts";

const run = (input: Omit<Parameters<typeof execute>[0], "command" | "offset">) =>
  execute({ ...input, command: "align", offset: undefined });

function fixture(context: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "align-record-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, ".jwn", "session", "align");
  const call = ({
    operation,
    payload,
    version,
  }: Pick<Parameters<typeof run>[0], "operation" | "payload" | "version">) =>
    run({ root, session: "session", operation, payload, version });
  call({
    operation: "write",
    payload: { type: "start", id: "s1", intention: "Improve initial loading." },
    version: undefined,
  });
  const record = (payload: unknown) => call({ operation: "write", payload, version: 1 });
  const read = () =>
    call({ operation: "read", payload: undefined, version: undefined }) as {
      version: number;
      records: Event[];
      nextOffset: number;
    };
  const confirm = () => {
    record({
      id: "qc",
      type: "question",
      question: "Is this intention correct?",
      ambiguity_ids: [],
      confirms_intention: true,
    });
    record({
      id: "rc",
      type: "response",
      question_id: "qc",
      value: "Yes, proceed.",
      confirms_intention: true,
    });
  };

  return { root, directory, path: join(directory, "v1.jsonl"), call, record, read, confirm };
}

test("native TypeScript CLI accepts stdin JSON and returns one JSON result", (context) => {
  const { root } = fixture(context);
  const script = fileURLToPath(new URL("../index.ts", import.meta.url));
  const result = spawnSync(
    process.execPath,
    [script, "align", "write", "--root", root, "--session", "cli"],
    {
      input: JSON.stringify({
        id: "s1",
        type: "start",
        intention: 'Keep "quotes", $(), and\nUnicode 한글 intact.',
      }),
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    JSON.parse(result.stdout).intention,
    'Keep "quotes", $(), and\nUnicode 한글 intact.',
  );
  assert.equal(result.stdout.trim().split("\n").length, 1);
});

test("CLI runs through a symlinked installed skill directory", (context) => {
  const { root } = fixture(context);
  const installed = join(root, "installed-align");
  symlinkSync(fileURLToPath(new URL("../", import.meta.url)), installed, "dir");
  const result = spawnSync(
    process.execPath,
    [join(installed, "index.ts"), "align", "write", "--root", root, "--session", "linked"],
    {
      input: JSON.stringify({ id: "s1", type: "start", intention: "Use the installed skill." }),
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).intention, "Use the installed skill.");
  assert.equal(existsSync(join(root, ".jwn", "linked", "align", "v1.jsonl")), true);
});

test("records research and responses, then writes a self-contained aligned marker", (context) => {
  const { record, confirm, call, read } = fixture(context);
  record({
    id: "u1",
    type: "understanding",
    ambiguities: [{ id: "a1", value: "What does loading include?", status: "open" }],
  });
  record({
    id: "q1",
    type: "question",
    question: "Which loading?",
    ambiguity_ids: ["a1"],
    selections: [{ id: 1, value: "Initial loading", recommend: true }],
  });

  assert.throws(
    () =>
      call({
        operation: "write",
        payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "q1" } },
        version: 1,
      }),
    /actual user confirmation/,
  );
  record({
    id: "r1",
    type: "response",
    question_id: "q1",
    value: "Initial loading.",
    selected_ids: [1],
  });
  record({
    id: "u2",
    type: "understanding",
    ambiguities: [
      { id: "a1", value: "What does loading include?", status: "resolved", resolved_by: "r1" },
    ],
  });
  confirm();
  const aligned = call({
    operation: "write",
    payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } },
    version: 1,
  });

  assert.ok("type" in aligned);
  assert.equal(aligned.type, "aligned");
  assert.equal(aligned.intention, "Improve initial loading.");
  assert.deepEqual(read().records.at(-1), aligned);
  assert.equal(read().records.find((event) => event.id === "u2")?.type, "understanding");
});

test("recommendations never supply an answer or final confirmation", (context) => {
  const { record, call, read } = fixture(context);
  record({
    id: "u1",
    type: "understanding",
    ambiguities: [{ id: "a1", value: "Which environment?", status: "open" }],
  });
  record({
    id: "q1",
    type: "question",
    question: "Which environment?",
    ambiguity_ids: ["a1"],
    selections: [{ id: 1, value: "Production", recommend: true }],
  });

  assert.equal(read().records.filter((event) => event.type === "question").length, 1);
  assert.throws(
    () =>
      record({
        id: "qc",
        type: "question",
        question: "Confirm?",
        ambiguity_ids: [],
        confirms_intention: true,
      }),
    /clear ambiguities/,
  );
  assert.throws(
    () =>
      call({
        operation: "write",
        payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "q1" } },
        version: 1,
      }),
    /actual user confirmation/,
  );
});

test("identical retries reuse records and conflicting retries preserve the bytes", (context) => {
  const { call, path, record, confirm } = fixture(context);

  assert.equal(
    call({
      operation: "write",
      payload: { type: "start", intention: "Improve initial loading.", id: "s1" },
      version: undefined,
    }).version,
    1,
  );
  const payload = { id: "r1", type: "response", value: "An unsolicited clarification." };
  const event = record(payload);
  const before = readFileSync(path);

  assert.deepEqual(record({ value: payload.value, type: payload.type, id: payload.id }), event);
  assert.throws(
    () => record({ ...payload, value: "A different answer." }),
    /conflicting event retry/,
  );
  assert.deepEqual(readFileSync(path), before);
  confirm();
  const finalized = call({
    operation: "write",
    payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } },
    version: 1,
  });

  assert.deepEqual(
    call({
      operation: "write",
      payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } },
      version: 1,
    }),
    finalized,
  );
});

test("an intention change creates a new pending version without inheriting approval", (context) => {
  const { confirm, call, record, path, directory, read } = fixture(context);
  confirm();
  call({
    operation: "write",
    payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } },
    version: 1,
  });
  record({ id: "change", type: "response", value: "Actually, improve navigation." });
  const before = readFileSync(path);
  const payload = {
    type: "start",
    id: "s2",
    intention: "Improve navigation.",
    reason: "user_correction",
    source: { version: 1, event_id: "change" },
  };
  const next = call({ operation: "write", payload, version: undefined });

  assert.equal(next.version, 2);
  assert.deepEqual(
    call({
      operation: "write",
      payload: { ...payload, id: "retry-with-new-id" },
      version: undefined,
    }),
    next,
  );
  assert.equal(read().version, 2);
  assert.notEqual(read().records.at(-1)?.type, "aligned");
  assert.deepEqual(readFileSync(path), before);
  assert.equal(readdirSync(directory).filter((name) => name.endsWith(".jsonl")).length, 2);
  assert.throws(
    () => record({ id: "late", type: "response", value: "Old-version write." }),
    /stale version/,
  );
  assert.throws(
    () =>
      call({
        operation: "write",
        payload: { type: "aligned", id: "seal-v2", source: { version: 1, event_id: "rc" } },
        version: 2,
      }),
    /preceding response/,
  );
});

test("unchanged intention and in-place intention changes are rejected", (context) => {
  const { record, call, path, directory } = fixture(context);
  record({ id: "r1", type: "response", value: "Keep the intention." });
  const before = readFileSync(path);

  assert.throws(
    () =>
      call({
        operation: "write",
        payload: {
          type: "start",
          id: "s2",
          intention: "Improve initial loading.",
          reason: "wording",
          source: { version: 1, event_id: "r1" },
        },
        version: undefined,
      }),
    /unchanged intention/,
  );
  assert.throws(
    () =>
      record({ id: "u1", type: "understanding", intention: "A new intention.", ambiguities: [] }),
    /start a new version/,
  );
  assert.throws(
    () =>
      call({
        operation: "write",
        payload: {
          type: "aligned",
          id: "seal",
          intention: "A new intention.",
          source: { version: 1, event_id: "r1" },
        },
        version: 1,
      }),
    /start a new version/,
  );
  assert.deepEqual(readFileSync(path), before);
  assert.equal(existsSync(join(directory, "v2.jsonl")), false);
});

test("evidence must exist and a response must address the resolved ambiguity", (context) => {
  const { record } = fixture(context);
  record({
    id: "u1",
    type: "understanding",
    ambiguities: [
      { id: "a1", value: "First?", status: "open" },
      { id: "a2", value: "Second?", status: "open" },
    ],
  });
  record({ id: "q1", type: "question", question: "First?", ambiguity_ids: ["a1"] });
  record({ id: "r1", type: "response", question_id: "q1", value: "Yes." });

  assert.throws(
    () =>
      record({
        id: "u2",
        type: "understanding",
        ambiguities: [{ id: "a2", value: "Second?", status: "resolved", resolved_by: "r1" }],
      }),
    /does not address/,
  );
  assert.throws(
    () =>
      record({
        id: "u2",
        type: "understanding",
        ambiguities: [{ id: "a1", value: "First?", status: "resolved", resolved_by: "missing" }],
      }),
    /prior evidence/,
  );
});

test("damaged records stop reads and invalid history prevents writes without repair", (context) => {
  const { path, read, record } = fixture(context);
  const header = readFileSync(path, "utf8");
  appendFileSync(path, '{"id":"partial');
  const damaged = readFileSync(path);

  assert.throws(read, /incomplete trailing record/);
  assert.throws(
    () => record({ id: "r1", type: "response", value: "New response." }),
    /incomplete trailing record/,
  );
  assert.deepEqual(readFileSync(path), damaged);
  writeFileSync(
    path,
    header +
      JSON.stringify({ id: "s1", type: "response", value: "Duplicate.", version: 1, seq: 2 }) +
      "\n",
  );

  assert.throws(
    () => record({ id: "new", type: "response", value: "New reply." }),
    /duplicate event ID/,
  );
  writeFileSync(
    path,
    header +
      JSON.stringify({ id: "r1", type: "response", value: "Gap.", version: 1, seq: 3 }) +
      "\n",
  );

  assert.throws(() => record({ id: "new", type: "response", value: "New reply." }), /sequence gap/);
  writeFileSync(path, header + JSON.stringify({ ...JSON.parse(header), id: "s2", seq: 2 }) + "\n");

  assert.throws(
    () => record({ id: "new", type: "response", value: "New reply." }),
    /start must be the first event/,
  );
});

test("an existing lock is never removed by a competing call", (context) => {
  const { directory, record } = fixture(context);
  const lock = join(directory, ".lock");
  mkdirSync(lock);
  writeFileSync(join(lock, "owner.json"), "existing writer");

  assert.throws(() => record({ id: "r1", type: "response", value: "Competing write." }), /locked/);
  assert.equal(readFileSync(join(lock, "owner.json"), "utf8"), "existing writer");
});

test("a corrected answer reopens its ambiguity and cannot be resolved with the old answer", (context) => {
  const { record, read, confirm } = fixture(context);
  const ambiguity = { id: "a1", value: "Which environment?", status: "open" };
  record({ id: "u1", type: "understanding", ambiguities: [ambiguity] });
  record({ id: "q1", type: "question", question: "Which environment?", ambiguity_ids: ["a1"] });
  record({ id: "r1", type: "response", question_id: "q1", value: "Production." });
  record({
    id: "u2",
    type: "understanding",
    ambiguities: [{ ...ambiguity, status: "resolved", resolved_by: "r1" }],
  });
  record({ id: "r2", type: "response", question_id: "q1", value: "Correction: staging." });

  assert.equal(read().records.at(-1)?.id, "r2");
  assert.throws(confirm, /clear ambiguities/);
  assert.throws(
    () =>
      record({
        id: "u3",
        type: "understanding",
        ambiguities: [{ ...ambiguity, status: "resolved", resolved_by: "r1" }],
      }),
    /latest response/,
  );
  record({
    id: "u3",
    type: "understanding",
    ambiguities: [{ ...ambiguity, status: "resolved", resolved_by: "r2" }],
  });

  assert.equal(read().records.at(-1)?.id, "u3");
});

test("invalid UTF-8 and missing versions stop reads without changing logs", (context) => {
  const { path, directory, read } = fixture(context);
  const header = readFileSync(path);
  appendFileSync(path, Buffer.from([0xff, 0x0a]));
  const damaged = readFileSync(path);

  assert.throws(read, /encoded data/);
  assert.deepEqual(readFileSync(path), damaged);
  writeFileSync(path, header);
  writeFileSync(join(directory, "v3.jsonl"), header);

  assert.throws(read, /version gap/);
});

test("explicit context imports work while later records reopen a finalized version", (context) => {
  const { record, call, confirm, read } = fixture(context);
  record({ id: "facts", type: "research", value: "Current behavior.", sources: ["src/app.ts"] });
  confirm();
  call({
    operation: "write",
    payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } },
    version: 1,
  });
  record({ id: "r2", type: "response", value: "A correction." });

  assert.notEqual(read().records.at(-1)?.type, "aligned");
  call({
    operation: "write",
    payload: {
      type: "start",
      id: "s2",
      intention: "A corrected intention.",
      reason: "correction",
      source: { version: 1, event_id: "r2" },
    },
    version: undefined,
  });
  call({
    operation: "write",
    payload: {
      id: "context",
      type: "context",
      value: "Current behavior remains relevant.",
      source: { version: 1, event_id: "facts" },
    },
    version: 2,
  });

  assert.equal(read().records[0]?.intention, "A corrected intention.");
  assert.notEqual(read().records.at(-1)?.type, "aligned");
});

// A saved marker is reusable only while it still represents the current alignment.
test("historical aligned markers cannot be returned as successful retries", (context) => {
  const { confirm, call, record, read, path } = fixture(context);
  confirm();
  const payload = { type: "aligned", id: "seal", source: { version: 1, event_id: "rc" } };
  call({ operation: "write", version: 1, payload });
  record({ id: "correction", type: "response", value: "I have another clarification." });

  assert.notEqual(read().records.at(-1)?.type, "aligned");
  const bytes = readFileSync(path);

  assert.throws(() => call({ operation: "write", version: 1, payload }), /alignment reopened/);
  assert.deepEqual(readFileSync(path), bytes);

  record({
    id: "qc2",
    type: "question",
    question: "Is this now correct?",
    ambiguity_ids: [],
    confirms_intention: true,
  });
  record({
    id: "rc2",
    type: "response",
    question_id: "qc2",
    value: "Yes.",
    confirms_intention: true,
  });
  const current = call({
    operation: "write",
    version: 1,
    payload: { type: "aligned", id: "seal2", source: { version: 1, event_id: "rc2" } },
  });

  assert.throws(() => call({ operation: "write", version: 1, payload }), /alignment reopened/);
  assert.deepEqual(read().records.at(-1), current);
});

test("a declined final confirmation is answered without approving and permits reconfirmation", (context) => {
  const { record, read, call } = fixture(context);
  record({
    id: "qc",
    type: "question",
    question: "Is this intention correct?",
    ambiguity_ids: [],
    confirms_intention: true,
  });
  record({
    id: "decline",
    type: "response",
    question_id: "qc",
    value: "Not quite. Please clarify the loading target.",
  });

  assert.equal(read().records.at(-1)?.id, "decline");
  assert.notEqual(read().records.at(-1)?.type, "aligned");
  assert.throws(
    () =>
      call({
        operation: "write",
        version: 1,
        payload: { type: "aligned", id: "seal", source: { version: 1, event_id: "decline" } },
      }),
    /actual user confirmation/,
  );

  record({
    id: "qc2",
    type: "question",
    question: "Improve time to first content on initial loading?",
    ambiguity_ids: [],
    confirms_intention: true,
  });
  record({
    id: "rc2",
    type: "response",
    question_id: "qc2",
    value: "Yes.",
    confirms_intention: true,
  });
  const aligned = call({
    operation: "write",
    version: 1,
    payload: { type: "aligned", id: "seal2", source: { version: 1, event_id: "rc2" } },
  });

  assert.deepEqual(read().records.at(-1), aligned);
});
