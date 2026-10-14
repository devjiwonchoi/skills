import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { write as writeJsonl } from "../jsonl.ts";
import { parseEvent, type Event } from "./schema.ts";

// Hydrate the canonical text for validation and CLI reads without duplicating it in the log.
export function load({ directory, records }: { directory: string; records: unknown[][] }) {
  return records.map((values) =>
    values.map((value) => {
      const event = parseEvent({ value });
      if (event.type !== "start" || event.schema_version === 1) {
        return event;
      }

      if (event.document !== `v${event.version}.md` || "content" in event) {
        throw new Error("invalid plan document reference or duplicated content");
      }

      const path = join(directory, event.document);
      if (!lstatSync(path).isFile()) {
        throw new Error("plan document must be a regular file");
      }

      const content = readFileSync(path);
      if (createHash("sha256").update(content).digest("hex") !== event.content_sha256) {
        throw new Error(
          "plan document hash mismatch; preserve the changed file and restore the recorded candidate",
        );
      }

      return { ...event, content: content.toString("utf8") };
    }),
  );
}

// Publish Markdown before its referencing log. Retried and legacy records preserve their form.
export function save({
  directory,
  record,
  retry,
}: {
  directory: string;
  record: Event;
  retry: boolean;
}) {
  const path = join(directory, `v${record.version}.jsonl`);
  let stored = record;
  let document: string | null = null;
  if (record.type === "start" && (!retry || record.schema_version === 2)) {
    const { content, ...metadata } = record;
    if (typeof content !== "string") {
      throw new Error("plan candidate content is missing");
    }
    if (Buffer.from(content, "utf8").toString("utf8") !== content) {
      throw new Error("plan content must be well-formed Unicode");
    }

    stored = parseEvent({
      value: {
        ...metadata,
        schema_version: 2,
        document: `v${record.version}.md`,
        content_sha256: createHash("sha256").update(content).digest("hex"),
      },
    });
    if (!retry) {
      document = join(directory, `v${record.version}.md`);
      writeFileSync(document, content, { flag: "wx", flush: true });
    }
  }

  try {
    writeJsonl({ path, record: stored, create: record.seq === 1, retry });
  } catch (error) {
    // A log may have been published before its directory flush failed. Retain its document.
    if (document !== null && !existsSync(path)) {
      rmSync(document);
    }

    throw error;
  }

  return stored;
}
