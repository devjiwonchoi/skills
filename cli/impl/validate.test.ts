import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEvent } from "./schema.ts";
import { create, next } from "./state.ts";
import { apply } from "./validate.ts";

test("Impl resumes the first unfinished stage and never accepts failed verification", () => {
  const state = create({ revision: null, sections: [], reason: undefined });
  assert.equal(next({ state }).step, "quick-impl");
  apply({
    state,
    event: parseEvent({ value: { id: "begin", type: "impl_started", seq: 1, version: 1 } }),
  });
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
  for (const outcome of ["failed", "passed"]) {
    apply({
      state,
      event: parseEvent({
        value: {
          id: outcome,
          type: "verified",
          revision: "r1",
          outcome,
          evidence: ["checks.json"],
          gaps: outcome === "failed" ? ["Runtime failure"] : [],
          seq: 3,
          version: 1,
        },
      }),
    });
    assert.equal(next({ state }).action, outcome === "failed" ? "blocked" : "complete");
  }
  apply({
    state,
    event: parseEvent({ value: { id: "resume", type: "impl_started", seq: 4, version: 1 } }),
  });
  assert.equal(next({ state }).step, "quick-impl");
});

test("Impl rejects predecessor mismatches without changing its revision", () => {
  const state = create({ revision: "r1", sections: [], reason: undefined });
  assert.throws(
    () =>
      apply({
        state,
        event: parseEvent({
          value: {
            id: "stale",
            type: "verified",
            previous_revision: "r0",
            revision: "r2",
            coverage: [],
            outcome: "passed",
            evidence: ["checks.json"],
            gaps: [],
            seq: 1,
            version: 1,
          },
        }),
      }),
    /previous_revision/,
  );
  assert.equal(state.revision, "r1");
  assert.equal(state.verification, null);
});
