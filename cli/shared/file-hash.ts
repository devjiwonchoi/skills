import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";

import * as z from "zod";

export const artifacts = z.array(
  z.strictObject({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) }),
);
export type Artifact = z.infer<typeof artifacts>[number];

// Capture only new successful outcomes. Historical reads and exact retries never read artifacts.
export function capture({ root, evidence }: { root: string; evidence: string[] }): Artifact[] {
  return evidence.map((path) => {
    const absolute = realpathSync(resolve(root, path));
    if (!statSync(absolute).isFile()) {
      throw new Error(`evidence is not a file: ${path}`);
    }
    return {
      path: absolute,
      sha256: createHash("sha256").update(readFileSync(absolute)).digest("hex"),
    };
  });
}

export function verify({
  root,
  evidence,
  recorded,
}: {
  root: string;
  evidence: string[];
  recorded: Artifact[] | undefined;
}) {
  if (!recorded || recorded.length !== evidence.length || recorded.length === 0) {
    throw new Error(
      "current evidence needs captured artifacts; record a fresh verification or review",
    );
  }
  const current = capture({ root, evidence });
  if (
    current.some(
      (artifact, index) =>
        artifact.path !== recorded[index]?.path || artifact.sha256 !== recorded[index]?.sha256,
    )
  ) {
    throw new Error("current evidence changed; record a fresh verification or review");
  }
}
