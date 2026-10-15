import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import align from "./align/index.ts";
import { readAligned } from "./align/validate.ts";
import impl from "./impl/index.ts";
import iterate from "./iterate/index.ts";
import plan from "./plan/index.ts";
import { parseEvent as parsePlanEvent } from "./plan/schema.ts";
import review from "./review/index.ts";
import { read, versions, withSessionLock, write } from "./shared/journal.ts";

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
  next,
  directory,
  checkHistory,
}: {
  schema: unknown;
  parseRequest: (input: { value: unknown }) => T;
  validate: (input: Omit<Input, "request"> & { request: T }) => Result;
  next: ((input: Omit<Input, "request">) => unknown) | undefined;
  directory: string | undefined;
  checkHistory: ((input: Omit<Input, "request">) => void) | undefined;
}) {
  return {
    schema,
    parseRequest,
    validate: ({ request, ...input }: Input) =>
      validate({ ...input, request: parseRequest({ value: request }) }),
    next,
    directory,
    checkHistory,
  };
}

const commands = new Map<string, ReturnType<typeof command>>([
  ["align", command({ ...align, next: undefined, directory: undefined, checkHistory: undefined })],
  ["plan", command({ ...plan, next: undefined, directory: undefined, checkHistory: undefined })],
  ["iterate", command(iterate)],
  ["impl", command({ ...impl, next: undefined })],
  ["review", command({ ...review, next: undefined })],
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
  operation: "read" | "write" | "next";
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

  if (operation !== "read" && offset !== undefined) {
    throw new Error("--offset is only supported by read");
  }

  if (operation === "next" && !skill.next) {
    throw new Error(`${command} does not support next`);
  }

  const request = operation === "write" ? skill.parseRequest({ value: payload }) : null;
  const directory = join(resolve(root), ".jwn", session, skill.directory ?? command);

  const store = ({ alignment }: { alignment: ReturnType<typeof readAligned> | null }) =>
    withSessionLock({
      directory,
      create: request?.type === "start",
      task: () => {
        const files = versions({ directory });
        if (operation === "next") {
          const records = files.map(
            (name) => read({ path: join(directory, name), offset: 0 }).records,
          );
          return { version: files.length, state: skill.next!({ records, session, version }) };
        }
        if (!request) {
          if (skill.checkHistory) {
            const records = files.map(
              (name) => read({ path: join(directory, name), offset: 0 }).records,
            );
            skill.checkHistory({ records, session, version: undefined });
          }
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

        const records = files.map(
          (name) => read({ path: join(directory, name), offset: 0 }).records,
        );
        if (alignment) {
          const candidate =
            request.type === "start"
              ? plan.parseRequest({ value: request })
              : parsePlanEvent({ value: records.at(-1)?.[0] });
          if (
            candidate.type !== "start" ||
            candidate.alignment.version !== alignment.version ||
            candidate.alignment.event_id !== alignment.event_id
          ) {
            throw new Error("Plan must reference the latest aligned event in this session");
          }
        }

        const { record, retry } = skill.validate({ records, session, request, version });
        const stored = retry ? record : { ...record, at: new Date().toISOString() };
        write({
          path: join(directory, `v${stored.version}.jsonl`),
          record: stored,
          create: stored.seq === 1,
          retry,
        });

        return stored;
      },
    });

  if (command === "plan" && request) {
    const alignmentDirectory = join(resolve(root), ".jwn", session, "align");
    if (!existsSync(alignmentDirectory)) {
      throw new Error("Align records are required before writing Plan");
    }

    // Hold Align's lock through the Plan write so its prerequisite cannot change in between.
    return withSessionLock({
      directory: alignmentDirectory,
      create: false,
      task: () => {
        const records = versions({ directory: alignmentDirectory }).map(
          (name) => read({ path: join(alignmentDirectory, name), offset: 0 }).records,
        );
        return store({ alignment: readAligned({ records, session }) });
      },
    });
  }

  return store({ alignment: null });
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
        "Usage: node <jwn-root>/cli/dist/index.mjs <command> <args>\nCommands: align, plan, iterate, impl, review\nUse <command> --help or --schema.\n",
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
          `Usage: node <jwn-root>/cli/dist/index.mjs ${command} <${skill.next ? "read|write|next" : "read|write"}> --session <id> [--root <project>] [--version <N>] [--offset <bytes>]\nread: records and nextOffset. write: stdin JSON → stored event.${skill.next ? " next: replay full history and derive recorded state. Offsets are read-only." : ""} --schema: event fields and descriptions. Node 24+.\n`,
        );
      } else if (values.schema) {
        process.stdout.write(JSON.stringify(skill.schema, null, 2) + "\n");
      } else {
        const [operation] = positionals;
        if (
          positionals.length !== 1 ||
          (operation !== "read" && operation !== "write" && !(operation === "next" && skill.next))
        ) {
          throw new Error(
            `${command} requires read or write${skill.next ? " or next" : ""}. Use --help.`,
          );
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
          payload: operation === "write" ? JSON.parse(readFileSync(0, "utf8")) : undefined,
        });
        process.stdout.write(JSON.stringify(result) + "\n");
      }
    }
  } catch (error) {
    process.stderr.write(`jwn: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
