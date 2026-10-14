import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEvent, parseRequest, schema } from "./schema.ts";

test("schema parsing preserves original text, extra fields, and absent versus null values", () => {
  const value = {
    id: "r1",
    type: "response",
    value: "  Yes.\n",
    question_id: null,
    selected_ids: null,
    evidence: { original: "  exact words  " },
  };
  assert.deepEqual(parseRequest({ value }), value);
  assert.deepEqual(parseEvent({ value: { ...value, seq: 2, version: 1 } }), {
    ...value,
    seq: 2,
    version: 1,
  });

  const omitted = { id: "r2", type: "response", value: "Unsolicited clarification." };
  assert.deepEqual(parseRequest({ value: omitted }), omitted);

  const question = {
    id: "q1",
    type: "question",
    question: "Which?",
    ambiguity_ids: ["a1"],
    selections: [{ id: 1, value: "First", explanation: "Keep this context." }],
  };
  assert.deepEqual(parseRequest({ value: question }), question);
});

test("generated schemas keep event fields while runtime validation rejects unsafe inputs", () => {
  const input = schema.inputSchema;
  assert.equal(input.anyOf?.length ?? input.oneOf?.length, 7);
  assert.match(JSON.stringify(input), /final confirmation/);

  for (const value of [
    { id: "r1", type: "response", value: "  " },
    { id: "r1", type: "response", value: "Yes", seq: 2 },
    { id: "r1", type: "response", value: "Yes", confirms_intention: "true" },
    { id: "r1", type: "response", value: "Yes", selected_ids: [1, 1] },
    { id: "r1", type: "response", value: "Yes", selected_ids: [Number.MAX_SAFE_INTEGER + 1] },
    { id: "q1", type: "question", question: "Which?", ambiguity_ids: ["a1", "a1"] },
    {
      id: "q1",
      type: "question",
      question: "Which?",
      ambiguity_ids: [],
      selections: [
        { id: 1, value: "A" },
        { id: 1, value: "B" },
      ],
    },
    {
      id: "u1",
      type: "understanding",
      ambiguities: [{ id: "a1", value: "Which?", status: "resolved" }],
    },
  ]) {
    assert.throws(() => parseRequest({ value }));
  }

  assert.throws(
    () =>
      parseEvent({
        value: {
          id: "s2",
          type: "start",
          intention: "Changed",
          seq: 1,
          version: 2,
          session_id: "session",
          schema_version: 1,
        },
      }),
    /reason and source/,
  );
});
