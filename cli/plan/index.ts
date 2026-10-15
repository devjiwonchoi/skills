import { parseRequest, schema } from "./schema.ts";
import { readiness, validate } from "./validate.ts";

export default { schema, parseRequest, validate, next: readiness };
