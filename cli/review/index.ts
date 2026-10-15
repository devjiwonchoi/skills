import { validate, checkHistory } from "../iterate/validate.ts";
import { schema, parseRequest } from "./schema.ts";

export default { directory: "iterate", schema, parseRequest, validate, checkHistory };
