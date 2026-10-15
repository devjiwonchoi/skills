import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEvent } from "./schema.ts";
import { create, context, reconcile } from "./state.ts";
import { apply } from "./validate.ts";

test("Review retains findings while a revision change reopens coverage", () => {
  const state = create({
    sections: [{ id: "input", path: "input.ts", behavior: "Input validation" }],
    reason: undefined,
    previous: null,
  });
  apply({
    state,
    revision: "r1",
    implementing: false,
    event: parseEvent({
      value: {
        id: "review",
        type: "review_pass",
        revision: "r1",
        reviewer: "current-agent",
        outcome: "completed",
        reviewed: ["input"],
        findings: [
          {
            id: "F1",
            section_id: "input",
            issue: "Invalid input",
            priority: "P2",
            status: "open",
            evidence: ["case.json"],
          },
        ],
        evidence: ["review.json"],
        gaps: [],
        seq: 1,
        version: 1,
      },
    }),
  });
  reconcile({ state, coverage: [{ section_id: "input", retain: false, reason: "Input changed" }] });
  assert.equal(context({ state }).pass, null);
  assert.deepEqual(
    context({ state }).sections.map((section) => section.id),
    ["input"],
  );
  assert.deepEqual(
    context({ state }).unresolvedP0P2.map((finding) => finding.id),
    ["F1"],
  );
});

test("Review successor plans retain finding identities and reopen prior sections", () => {
  const sections = [{ id: "input", path: "input.ts", behavior: "Input validation" }];
  const state = create({ sections, reason: undefined, previous: null });
  state.findings.set("F1", {
    id: "F1",
    section_id: "input",
    issue: "Invalid input",
    priority: "P2",
    status: "open",
    evidence: ["case.json"],
  });
  assert.throws(
    () => create({ sections: [], reason: "Changed plan", previous: state }),
    /retain existing review sections/,
  );
  const successor = create({ sections, reason: "Changed plan", previous: state });
  assert.deepEqual(
    context({ state: successor }).unresolvedP0P2.map((finding) => finding.id),
    ["F1"],
  );
  assert.equal(successor.coverage.get("input")?.reviewedRevision, null);
});
