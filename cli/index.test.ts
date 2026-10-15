import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./index.ts", import.meta.url));

test("shared entry point and Align expose their own help without reading stdin", () => {
  for (const args of [
    ["--help"],
    ["align", "--help"],
    ["align", "--schema"],
    ["plan", "--help"],
    ["plan", "--schema"],
    ["execute", "--help"],
    ["execute", "--schema"],
    ["impl", "--help"],
    ["impl", "--schema"],
    ["review", "--help"],
    ["review", "--schema"],
  ]) {
    const result = spawnSync(process.execPath, [script, ...args], {
      encoding: "utf8",
      timeout: 5000,
    });

    assert.equal(result.status, 0, result.stderr);
    if (args.includes("--schema")) {
      assert.ok(JSON.parse(result.stdout).inputSchema);
    } else {
      assert.match(result.stdout, /Usage:/);
      assert.match(
        result.stdout,
        args[0] === "execute"
          ? /<read\|write\|next>/
          : args[0] !== "--help"
            ? /<read\|write>/
            : /<command> <args>/,
      );
    }
  }
});

test("invalid commands and Align arguments fail before creating alignment state", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-invalid-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  for (const args of [
    [],
    ["unknown"],
    ["align"],
    ["align", "start"],
    ["align", "unknown"],
    ["align", "next"],
    ["plan", "next"],
    ["execute", "next"],
    ["align", "write", "--unknown"],
    ["align", "--action", "read"],
  ]) {
    const result = spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      input: "",
      encoding: "utf8",
      timeout: 5000,
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /jwn:/);
    assert.equal(existsSync(join(root, ".jwn")), false);
  }
});

test("Execute's public commands record and recover work without reading stdin for next", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-execute-cli-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const invoke = ({
    command,
    operation,
    payload,
    args,
  }: {
    command: string;
    operation: string;
    payload: unknown;
    args: string[];
  }) => {
    const result = spawnSync(
      process.execPath,
      [script, command, operation, "--root", root, "--session", "session", ...args],
      {
        encoding: "utf8",
        input: payload === undefined ? "this is not JSON" : JSON.stringify(payload),
        timeout: 5000,
      },
    );
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  invoke({
    command: "execute",
    operation: "write",
    payload: {
      id: "start",
      type: "start",
      goal: "Inspect current behavior",
      plan: null,
      revision: "r1",
      scope: [{ id: "input", path: "input.ts", behavior: "Input validation" }],
    },
    args: [],
  });
  assert.equal(
    invoke({ command: "execute", operation: "next", payload: undefined, args: [] }).state.step,
    "verify",
  );
  invoke({
    command: "impl",
    operation: "write",
    payload: {
      id: "checks",
      type: "verified",
      revision: "r1",
      outcome: "passed",
      evidence: ["checks.json"],
      gaps: [],
    },
    args: ["--version", "1"],
  });
  assert.equal(
    invoke({ command: "execute", operation: "next", payload: undefined, args: ["--version", "1"] })
      .state.action,
    "review",
  );
  invoke({
    command: "review",
    operation: "write",
    payload: {
      id: "review",
      type: "review_pass",
      revision: "r1",
      reviewer: "current-agent",
      outcome: "completed",
      reviewed: ["input"],
      findings: [],
      evidence: ["review.json"],
      gaps: [],
    },
    args: ["--version", "1"],
  });
  assert.equal(
    invoke({ command: "execute", operation: "next", payload: undefined, args: [] }).state.action,
    "complete",
  );
  const read = invoke({ command: "execute", operation: "read", payload: undefined, args: [] });
  assert.equal(read.records.length, 3);
  assert.equal(
    invoke({
      command: "execute",
      operation: "read",
      payload: undefined,
      args: ["--version", "1", "--offset", String(read.nextOffset)],
    }).records.length,
    0,
  );
});

test("the shared CLI records, finalizes and recovers an alignment", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-align-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const invoke = ({
    operation,
    payload,
    version,
  }: {
    operation: "read" | "write";
    payload: unknown;
    version: number | undefined;
  }) => {
    const args = [script, "align", operation, "--session", "session"];
    if (version !== undefined) {
      args.push("--version", String(version));
    }

    const result = spawnSync(process.execPath, args, {
      cwd: root,
      input: payload === undefined ? "" : JSON.stringify(payload),
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);

    return JSON.parse(result.stdout);
  };

  const events = [
    {
      id: "s1",
      intention: "Improve initial loading.",
      prompt: "Make initial loading faster.",
      type: "start",
    },
    {
      id: "u1",
      type: "understanding",
      ambiguities: [{ id: "a1", value: "Which initial loading goal?", status: "open" }],
    },
    {
      id: "q1",
      type: "question",
      question: "Which initial loading goal?",
      ambiguity_ids: ["a1"],
      selections: [
        { id: 1, value: "Reduce time to first content", recommend: true },
        { id: 2, value: "Reduce time to interactive" },
      ],
    },
    { id: "r1", type: "response", question_id: "q1", value: "First content.", selected_ids: [1] },
    {
      id: "u2",
      type: "understanding",
      ambiguities: [
        { id: "a1", value: "Which initial loading goal?", status: "resolved", resolved_by: "r1" },
      ],
    },
    {
      id: "qc",
      type: "question",
      question: "Confirm: improve initial loading by reducing time to first content?",
      ambiguity_ids: [],
      confirms_intention: true,
    },
    { id: "rc", type: "response", question_id: "qc", value: "Yes.", confirms_intention: true },
    { id: "aligned-1", type: "aligned" },
  ];
  let version: number | undefined;
  let aligned: unknown;
  for (const payload of events) {
    const event = invoke({
      operation: "write",
      payload,
      version: payload.type === "start" ? undefined : version,
    });
    version = event.version;
    if (payload.type === "aligned") {
      aligned = event;
    }
  }

  assert.ok(aligned, "workflow must reach finalization");
  const state = invoke({ operation: "read", payload: undefined, version: undefined });

  assert.deepEqual(state.records.at(-1), aligned);
  assert.equal(state.records[0].intention, "Improve initial loading.");
  assert.equal(state.records[0].id, "s1");
  assert.equal(state.records[0].prompt, "Make initial loading faster.");
  assert.equal(state.path, join(realpathSync(root), ".jwn", "session", "align", "v1.jsonl"));
});

test("importing the command and common entry point has no CLI side effects", (context) => {
  const root = mkdtempSync(join(tmpdir(), "jwn-import-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const command = new URL("./align/validate.ts", import.meta.url).href;
  const entry = new URL("./index.ts", import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `await import(${JSON.stringify(command)}); await import(${JSON.stringify(entry)});`,
    ],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(existsSync(join(root, ".jwn")), false);
});
