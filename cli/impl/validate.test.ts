import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEvent } from "./schema.ts";
import { create, next } from "./state.ts";
import { apply } from "./validate.ts";
test("Impl requires a completed implementation with its current predecessor", () => {
  const state = create({ revision: null, sections: [], reason: undefined });
  assert.equal(next({ state }).step, "quick-impl");
  apply({
    state,
    event: parseEvent({ value: { id: "start", type: "impl_started", seq: 1, version: 1 } }),
  });
  assert.throws(
    () =>
      apply({
        state,
        event: parseEvent({
          value: {
            id: "bad",
            type: "implemented",
            previous_revision: "stale",
            revision: "r1",
            coverage: [],
            seq: 2,
            version: 1,
          },
        }),
      }),
    /previous_revision/,
  );
  apply({
    state,
    event: parseEvent({
      value: {
        id: "impl",
        type: "implemented",
        previous_revision: null,
        revision: "r1",
        coverage: [],
        seq: 2,
        version: 1,
      },
    }),
  });
  assert.equal(next({ state }).step, "verify");
  assert.equal(state.verification, null);
});
