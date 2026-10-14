import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseJsonl, read } from "./jsonl.ts";

test("parses JSON values without interpreting alignment events", () => {
  const values = [null, 1, ["a"], { message: '한글\n"quotes"', arbitrary: true }];
  const content = values.map((value) => JSON.stringify(value)).join("\r\n") + "\r\n";

  assert.deepEqual(parseJsonl({ content }), values);
});

test("rejects empty or incomplete logs even when the last JSON value is valid", () => {
  for (const content of ["", "{}", '{}\n{"partial"']) {
    assert.throws(() => parseJsonl({ content }), /empty log or incomplete trailing record/);
  }
});

test("reports a damaged line instead of silently omitting it", () => {
  for (const content of ["{}\ninvalid\n{}\n", "{}\n\n{}\n"]) {
    assert.throws(
      () => parseJsonl({ content }),
      (error) => {
        assert.equal((error as Error).message, "invalid JSONL at line 2");
        assert.ok((error as Error).cause instanceof SyntaxError);

        return true;
      },
    );
  }
});

// The cursor belongs to one physical file, including Unicode and BOM bytes.
test("read resumes at nextOffset and returns an empty tail at EOF", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "jwn-offset-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "v1.jsonl");
  writeFileSync(path, "\ufeff" + JSON.stringify({ message: "한글" }) + "\n");
  const first = read({ path, offset: 0 });

  assert.deepEqual(first.records, [{ message: "한글" }]);
  assert.equal(first.nextOffset, readFileSync(path).length);
  assert.deepEqual(read({ path, offset: first.nextOffset }), {
    records: [],
    nextOffset: first.nextOffset,
  });
  appendFileSync(path, JSON.stringify({ message: "next" }) + "\n");

  assert.deepEqual(read({ path, offset: first.nextOffset }).records, [{ message: "next" }]);
  assert.throws(() => read({ path, offset: 4 }), /complete JSONL line/);
  assert.throws(() => read({ path, offset: first.nextOffset + 1000 }), /outside the log/);
});
