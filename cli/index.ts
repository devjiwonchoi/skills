import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import align from "./align/index.ts";
import { read, versions, withSessionLock, write } from "./jsonl.ts";
import plan from "./plan/index.ts";

type Input = {
  records: unknown[][];
  session: string;
  request: unknown;
  version: number | undefined;
};
type Result = {
  record: Record<string, unknown> & { id: string; type: string; seq: number; version: number };
  retry: boolean;
};

// Keep each command's inferred request type behind the same storage-facing interface.
function command<T extends { id: string; type: string }>({
  schema,
  parseRequest,
  validate,
}: {
  schema: unknown;
  parseRequest: (input: { value: unknown }) => T;
  validate: (input: Omit<Input, "request"> & { request: T }) => Result;
}) {
  return {
    schema,
    parseRequest,
    validate: ({ request, ...input }: Input) =>
      validate({ ...input, request: parseRequest({ value: request }) }),
  };
}

const commands = new Map<string, ReturnType<typeof command>>([
  ["align", command(align)],
  ["plan", command(plan)],
]);

export function run({
  command,
  root,
  session,
  operation,
  version,
  offset,
  payload,
}: {
  command: string;
  root: string;
  session: string;
  operation: "read" | "write";
  version: number | undefined;
  offset: number | undefined;
  payload: unknown;
}) {
  const skill = commands.get(command);
  if (!skill) {
    throw new Error(`unknown command: ${command}`);
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(session)) {
    throw new Error("invalid session ID");
  }

  if (version !== undefined && (!Number.isSafeInteger(version) || version < 1)) {
    throw new Error("invalid version");
  }

  if (operation === "write" && offset !== undefined) {
    throw new Error("--offset is only supported by read");
  }

  const request = operation === "write" ? skill.parseRequest({ value: payload }) : null;
  const directory = join(resolve(root), ".jwn", session, command);

  return withSessionLock({
    directory,
    create: request?.type === "start",
    task: () => {
      const files = versions({ directory });
      if (!request) {
        const selected = version ?? files.length;
        const file = files[selected - 1];
        if (file === undefined) {
          throw new Error("version does not exist");
        }

        const path = join(directory, file);

        return {
          path,
          version: selected,
          latestVersion: files.length,
          ...read({ path, offset: offset ?? 0 }),
        };
      }

      const records = files.map((name) => read({ path: join(directory, name), offset: 0 }).records);
      const { record, retry } = skill.validate({ records, session, request, version });
      const stored = retry ? record : { ...record, at: new Date().toISOString() };
      write({
        path: join(directory, `v${stored.version}.jsonl`),
        record: stored,
        create: stored.seq === 1,
        retry,
      });

      // Markdown is a replaceable view. Only the JSONL candidate controls approval and recovery.
      if (command === "plan" && stored.type === "start") {
        if (typeof stored.content !== "string") {
          throw new Error("plan candidate content is missing");
        }

        const temporary = join(directory, `.plan-${randomUUID()}.tmp`);
        try {
          writeFileSync(temporary, stored.content, { flag: "wx", flush: true });
          renameSync(temporary, join(directory, `v${stored.version}.md`));
        } finally {
          rmSync(temporary, { force: true });
        }
      }

      return stored;
    },
  });
}

// Importing the entry point has no CLI side effects, including through an installed symlink.
if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === undefined) {
      throw new Error("unknown command: (missing). Use --help.");
    }

    if (command === "--help") {
      process.stdout.write(
        "Usage: node <jwn-root>/cli/dist/index.mjs <command> <args>\nCommands: align, plan\nUse <command> --help or --schema.\n",
      );
    } else {
      const skill = commands.get(command);
      if (!skill) {
        throw new Error(`unknown command: ${command ?? "(missing)"}. Use --help.`);
      }

      const { values, positionals } = parseArgs({
        args,
        allowPositionals: true,
        options: {
          root: { type: "string", default: process.cwd() },
          session: { type: "string" },
          version: { type: "string" },
          offset: { type: "string" },
          help: { type: "boolean" },
          schema: { type: "boolean" },
        },
      });
      if (values.help) {
        process.stdout.write(
          `Usage: node <jwn-root>/cli/dist/index.mjs ${command} <read|write> --session <id> [--root <project>] [--version <N>] [--offset <bytes>]\nread: records and nextOffset. write: stdin JSON → stored event. --schema: event fields and descriptions. Node 24+.\n`,
        );
      } else if (values.schema) {
        process.stdout.write(JSON.stringify(skill.schema, null, 2) + "\n");
      } else {
        const [operation] = positionals;
        if (positionals.length !== 1 || (operation !== "read" && operation !== "write")) {
          throw new Error(`${command} requires read or write. Use --help.`);
        }

        if (values.session === undefined) {
          throw new Error("expected a session ID");
        }

        const result = run({
          command,
          root: values.root!,
          session: values.session,
          operation,
          version: values.version === undefined ? undefined : Number(values.version),
          offset: values.offset === undefined ? undefined : Number(values.offset),
          payload: operation === "read" ? undefined : JSON.parse(readFileSync(0, "utf8")),
        });
        process.stdout.write(JSON.stringify(result) + "\n");
      }
    }
  } catch (error) {
    process.stderr.write(`jwn: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
