import * as z from "zod";

import { artifacts } from "../shared/file-hash.ts";

export const text = z.string().regex(/\S/, "expected nonempty text");
export const sha = z.string().regex(/^[a-f0-9]{40}$/i);
const strings = z
  .array(text)
  .refine((items) => new Set(items).size === items.length, "duplicate value");
const target = z.strictObject({
  url: z.url(),
  head: sha,
  base: text,
  base_sha: sha,
  required_checks: strings,
  expected_bots: strings,
});
const targets = z
  .array(target)
  .min(1)
  .refine((items) => new Set(items.map((item) => item.url)).size === items.length, "duplicate PR");
const base = z.strictObject({ id: text });
const start = base.extend({ type: z.literal("start"), goal: text, authorization: text });
const selected = base.extend({
  type: z.literal("targets"),
  revision: text,
  pull_requests: targets,
});
const attempt = base.extend({
  type: z.literal("attempt"),
  operation: z.enum(["commit", "push", "create_pr", "update_pr", "rerun"]),
  target: text,
  expected_head: sha.nullable(),
  retry_of: text.optional(),
  reason: text.optional(),
});
const result = base.extend({
  type: z.literal("result"),
  attempt_id: text,
  outcome: z.enum(["succeeded", "failed", "uncertain"]),
  evidence: z.array(text).min(1),
  reconciled: z.boolean().optional(),
});
const observed = base.extend({ type: z.literal("observed") });
const ready = base.extend({ type: z.literal("ready") });
const status = z.enum(["passed", "pending", "failed", "stale"]);
const observation = z.strictObject({
  url: z.url(),
  head: sha,
  base: text,
  base_sha: sha,
  checks: status,
  bots: status,
  findings: z.boolean(),
  draft: z.boolean(),
  open: z.boolean(),
});
const metadata = {
  seq: z.int().positive(),
  version: z.int().positive(),
  at: z.iso.datetime().optional(),
  artifacts: artifacts.optional(),
};
const requests = z.discriminatedUnion("type", [start, selected, attempt, result, observed, ready]);
export const events = z.discriminatedUnion("type", [
  start.extend({ ...metadata, session_id: text, schema_version: z.literal(1) }),
  selected.extend(metadata),
  attempt.extend(metadata),
  result.extend(metadata),
  observed.extend({
    ...metadata,
    observations: z.array(observation).min(1),
    evidence: z.array(text).min(1),
  }),
  ready.extend({
    ...metadata,
    observations: z.array(observation).min(1),
    evidence: z.array(text).min(1),
  }),
]);
export type Event = z.infer<typeof events>;
export type Request = z.infer<typeof requests>;
export type Target = z.infer<typeof target>;
export function requestFields({ event }: { event: Event }) {
  const hidden = [
    "seq",
    "version",
    "at",
    "session_id",
    "schema_version",
    "artifacts",
    "observations",
  ];
  if (event.type === "observed" || event.type === "ready") {
    hidden.push("evidence");
  }
  return Object.fromEntries(Object.entries(event).filter(([key]) => !hidden.includes(key)));
}

export const schema = {
  get inputSchema() {
    return z.toJSONSchema(requests);
  },
  rules: [
    "Record attempts before mutation and results afterward. Unknown effects require remote reconciliation, never blind repetition. Targets include exact head/base and required checks/expected bot logins from repository policy and the approved Plan. observed and ready perform fresh read-only GitHub observations. ready also requires current execution and artifact evidence. No expected bot means an explicitly established empty expectation, not an unreported scheduled bot. Authorization remains a caller judgment.",
  ],
};

export function parseRequest({ value }: { value: unknown }) {
  return requests.parse(value);
}
export type Observation = z.infer<typeof observation>;
