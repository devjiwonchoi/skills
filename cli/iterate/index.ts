import { schema, parseRequest } from "./schema.ts";
import { next as nextAction } from "./state.ts";
import { validate, checkHistory, readState } from "./validate.ts";

export { validate, checkHistory, readState } from "./validate.ts";

export default {
  schema,
  parseRequest,
  validate,
  checkHistory,
  directory: "iterate",
  next: ({
    records,
    session,
    version,
  }: {
    records: unknown[][];
    session: string;
    version: number | undefined;
  }) => nextAction({ state: readState({ records, session, version }) }),
};
