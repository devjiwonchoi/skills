import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

// A complete log ends in a newline. Reject damaged records instead of skipping them.
export function parseJsonl({ content }: { content: string }): unknown[] {
  if (content.length === 0 || !content.endsWith("\n")) {
    throw new Error("empty log or incomplete trailing record");
  }

  return content
    .slice(0, -1)
    .split("\n")
    .map((line, index) => {
      try {
        return JSON.parse(line) as unknown;
      } catch (error) {
        throw new Error(`invalid JSONL at line ${index + 1}`, { cause: error });
      }
    });
}

// Offsets are physical bytes within one version file, always at a complete line boundary.
export function read({ path, offset }: { path: string; offset: number }) {
  const descriptor = openSync(path, "r");
  try {
    const size = fstatSync(descriptor).size;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > size) {
      throw new Error("offset is outside the log; read from offset 0");
    }

    if (offset > 0) {
      const previous = new Uint8Array(1);
      if (readSync(descriptor, previous, 0, 1, offset - 1) !== 1 || previous[0] !== 0x0a) {
        throw new Error("offset must follow a complete JSONL line");
      }
    }

    if (offset === size && size > 0) {
      return { records: [], nextOffset: size };
    }

    const bytes = new Uint8Array(size - offset);
    let received = 0;
    while (received < bytes.length) {
      const count = readSync(
        descriptor,
        bytes,
        received,
        bytes.length - received,
        offset + received,
      );
      if (count === 0) {
        throw new Error("log changed during read");
      }

      received += count;
    }

    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    return { records: parseJsonl({ content }), nextOffset: size };
  } finally {
    closeSync(descriptor);
  }
}

export function versions({ directory }: { directory: string }) {
  const files = readdirSync(directory).filter(
    (name) => name.startsWith("v") && name.endsWith(".jsonl"),
  );
  if (!files.every((name) => /^v[1-9]\d*\.jsonl$/.test(name))) {
    throw new Error("invalid version filename");
  }

  files.sort((left, right) => Number(left.slice(1, -6)) - Number(right.slice(1, -6)));
  for (const [index, name] of files.entries()) {
    if (name !== `v${index + 1}.jsonl`) {
      throw new Error("version gap");
    }
  }

  return files;
}

// Validate under this lock before writing. New versions are published complete; retries only flush.
export function write({
  path,
  record,
  create,
  retry,
}: {
  path: string;
  record: unknown;
  create: boolean;
  retry: boolean;
}) {
  const directory = dirname(path);
  if (retry) {
    const descriptor = openSync(path, "r");
    try {
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
  } else if (create) {
    const temporary = join(directory, `.start-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, JSON.stringify(record) + "\n", { flag: "wx", flush: true });
      linkSync(temporary, path);
    } finally {
      rmSync(temporary, { force: true });
    }
  } else {
    writeFileSync(path, JSON.stringify(record) + "\n", { flag: "a", flush: true });
  }

  if (create || retry) {
    const descriptor = openSync(directory, "r");
    try {
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
  }
}

// Only the writer that acquired the lock removes it, including when validation rejects the request.
export function withSessionLock<T>({
  directory,
  create,
  task,
}: {
  directory: string;
  create: boolean;
  task: () => T;
}) {
  if (create) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(directory)) {
    throw new Error("session does not exist");
  }

  const lock = join(directory, ".lock");
  try {
    mkdirSync(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("session is locked; verify its writer stopped before removing the lock");
    }

    throw error;
  }

  try {
    writeFileSync(join(lock, "owner.json"), JSON.stringify({ pid: process.pid }));

    return task();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}
