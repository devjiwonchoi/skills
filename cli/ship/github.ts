import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

import * as z from "zod";

import { sha, text, type Target, type Observation } from "./schema.ts";

// Read-only GitHub requests are pinned by before/after identity reads. The caller owns policy selection.
function gh({ root, host, args }: { root: string; host: string; args: string[] }): unknown {
  const result = spawnSync("gh", ["api", "--hostname", host, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 60000,
    maxBuffer: Infinity,
  });
  if (result.status !== 0 || result.error) {
    throw new Error(result.error?.message ?? result.stderr.trim() ?? "GitHub observation failed");
  }
  const value: unknown = JSON.parse(result.stdout);
  if (typeof value === "object" && value !== null && "errors" in value) {
    throw new Error("incomplete GitHub observation");
  }
  return value;
}
const pull = z.object({
  html_url: z.url(),
  state: text,
  draft: z.boolean(),
  head: z.object({ sha, ref: text }),
  base: z.object({ sha, ref: text }),
});
const check = z.object({
  id: z.number(),
  name: text,
  status: text,
  conclusion: z.string().nullable(),
  app: z.object({ id: z.number() }).nullable(),
});
const commitStatus = z.object({ id: z.number(), context: text, state: text });
const review = z.object({
  id: z.number(),
  state: text,
  commit_id: sha.nullable(),
  user: z.object({ login: text }),
});
export function observe({ root, targets }: { root: string; targets: Target[] }) {
  const evidence: unknown[] = [];
  const observations = targets.map((wanted) => {
    const url = new URL(wanted.url);
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/([1-9][0-9]*)$/);
    if (
      url.protocol !== "https:" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      !match
    ) {
      throw new Error("expected an exact HTTPS PR URL");
    }
    const [, owner, repo, number] = match;
    const endpoint = `repos/${owner}/${repo}`;
    const read = (args: string[]) => gh({ root, host: url.host, args });
    const before = pull.parse(read([`${endpoint}/pulls/${number}`]));
    const checkPages = z
      .array(z.object({ total_count: z.number(), check_runs: z.array(check) }))
      .parse(
        read([
          "--paginate",
          "--slurp",
          `${endpoint}/commits/${before.head.sha}/check-runs?per_page=100`,
        ]),
      );
    const runs = checkPages.flatMap((page) => page.check_runs);
    if (!checkPages.length || checkPages.some((page) => page.total_count !== runs.length)) {
      throw new Error("incomplete check-run pages");
    }
    const statuses = z
      .array(z.array(commitStatus))
      .parse(
        read([
          "--paginate",
          "--slurp",
          `${endpoint}/commits/${before.head.sha}/statuses?per_page=100`,
        ]),
      )
      .flat();
    const reviews = z
      .array(z.array(review))
      .parse(read(["--paginate", "--slurp", `${endpoint}/pulls/${number}/reviews?per_page=100`]))
      .flat();
    let cursor: string | null = null;
    const cursors = new Set<string>();
    const threads: { isResolved: boolean; isOutdated: boolean }[] = [];
    for (;;) {
      const query =
        "query($owner:String!,$name:String!,$number:Int!,$after:String){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100,after:$after){nodes{isResolved isOutdated}pageInfo{hasNextPage endCursor}}}}}";
      const response = z
        .object({
          data: z.object({
            repository: z.object({
              pullRequest: z.object({
                reviewThreads: z.object({
                  nodes: z.array(z.object({ isResolved: z.boolean(), isOutdated: z.boolean() })),
                  pageInfo: z.object({
                    hasNextPage: z.boolean(),
                    endCursor: z.string().nullable(),
                  }),
                }),
              }),
            }),
          }),
        })
        .parse(
          read([
            "graphql",
            "-f",
            `query=${query}`,
            "-f",
            `owner=${owner}`,
            "-f",
            `name=${repo}`,
            "-F",
            `number=${number}`,
            ...(cursor ? ["-f", `after=${cursor}`] : []),
          ]),
        );
      const page = response.data.repository.pullRequest.reviewThreads;
      threads.push(...page.nodes);
      evidence.push(response);
      if (!page.pageInfo.hasNextPage) {
        break;
      }
      if (!page.pageInfo.endCursor || cursors.has(page.pageInfo.endCursor)) {
        throw new Error("incomplete review-thread pages");
      }
      cursor = page.pageInfo.endCursor;
      cursors.add(cursor);
    }
    const after = pull.parse(read([`${endpoint}/pulls/${number}`]));
    evidence.push({ before, checkPages, statuses, reviews, after });
    const latestRuns = new Map<string, z.infer<typeof check>>();
    for (const item of runs) {
      const key = `${item.app?.id}:${item.name}`;
      if ((latestRuns.get(key)?.id ?? -1) < item.id) {
        latestRuns.set(key, item);
      }
    }
    const latestStatuses = new Map<string, z.infer<typeof commitStatus>>();
    for (const item of statuses) {
      if ((latestStatuses.get(item.context)?.id ?? -1) < item.id) {
        latestStatuses.set(item.context, item);
      }
    }
    const checks = [...latestRuns.values()].map((item) => ({
      name: item.name,
      state:
        item.status !== "completed"
          ? "pending"
          : ["success", "neutral", "skipped"].includes(item.conclusion ?? "")
            ? "passed"
            : "failed",
    }));
    checks.push(
      ...[...latestStatuses.values()].map((item) => ({
        name: item.context,
        state:
          item.state === "success" ? "passed" : item.state === "pending" ? "pending" : "failed",
      })),
    );
    const latestReviews = new Map<string, z.infer<typeof review>>();
    const effectiveReviews = new Map<string, z.infer<typeof review>>();
    for (const item of reviews) {
      if ((latestReviews.get(item.user.login)?.id ?? -1) < item.id) {
        latestReviews.set(item.user.login, item);
      }
    }
    for (const item of [...reviews].sort((a, b) => a.id - b.id)) {
      if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(item.state)) {
        effectiveReviews.set(item.user.login, item);
      }
    }
    const identity =
      before.html_url === wanted.url &&
      isDeepStrictEqual(before, after) &&
      after.head.sha === wanted.head &&
      after.base.ref === wanted.base &&
      after.base.sha === wanted.base_sha;
    const missing = wanted.required_checks.some(
      (name) => !checks.some((item) => item.name === name),
    );
    const findings =
      threads.some((item) => !item.isResolved && !item.isOutdated) ||
      [...effectiveReviews.values()].some((item) => item.state === "CHANGES_REQUESTED");
    const bots = wanted.expected_bots.every((name) => {
      const item = latestReviews.get(name);
      return item?.commit_id === after.head.sha && ["APPROVED", "COMMENTED"].includes(item.state);
    });
    return {
      url: wanted.url,
      head: after.head.sha,
      base: after.base.ref,
      base_sha: after.base.sha,
      checks: !identity
        ? "stale"
        : checks.some((item) => item.state === "failed")
          ? "failed"
          : missing || checks.some((item) => item.state === "pending")
            ? "pending"
            : "passed",
      bots: !identity ? "stale" : bots ? "passed" : "pending",
      findings,
      draft: after.draft,
      open: after.state === "open",
    } as Observation;
  });
  return { observations, evidence };
}
