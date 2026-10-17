import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { bind, read, change, hook, worker, run } from './continuation.mjs';

async function fixture({ t }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jwn space '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const task = path.join(await fs.realpath(root), '.jwn', 'task');
  await fs.mkdir(task, { recursive: true });
  await fs.writeFile(
    path.join(task, 'STATUS.md'),
    '## Continuation\n- State: ready\n- Next action: run',
  );
  await fs.writeFile(path.join(task, 'PLAN.md'), 'approved');
  const file = await bind({ task, chat: 'a', host: 'desktop' });

  return { root, task, file };
}

function child({ args }) {
  return new Promise((resolve, reject) => {
    const process = spawn(globalThis.process.execPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    process.stderr.on('data', chunk => {
      stderr += chunk;
    });
    process.on('error', reject);
    process.on('exit', code => (code === 0 ? resolve() : reject(new Error(stderr))));
  });
}
test('separate processes serialize writes; duplicate Stop and retained lock', async t => {
  const { root, file } = await fixture({ t });
  const module = pathToFileURL(
    fileURLToPath(new URL('./continuation.mjs', import.meta.url)),
  ).href;
  const code = `import {change} from ${JSON.stringify(module)};await change({file:${JSON.stringify(file)},run:async b=>{await new Promise(r=>setTimeout(r,30));b.count=(b.count||0)+1}});`;
  await Promise.all(
    Array.from({ length: 6 }, () => child({ args: ['--input-type=module', '-e', code] })),
  );
  assert.equal((await read({ file })).count, 6);
  const event = { session_id: 'a', cwd: root, hook_event_name: 'Stop', turn_id: 'one' };
  const results = await Promise.all([hook({ event }), hook({ event })]);
  assert.equal(results.filter(value => value.decision === 'block').length, 1);
  assert.deepEqual(await hook({ event: { ...event, session_id: 'foreign' } }), {});
  const lock = file.replace(/\.json$/, '.node-lock');
  await fs.mkdir(lock);
  await fs.writeFile(path.join(lock, 'owner.json'), '{"pid":1}');
  await assert.rejects(change({ file, run: () => {} }), /retained/);
  assert.equal(await fs.readFile(path.join(lock, 'owner.json'), 'utf8'), '{"pid":1}');
});
test('CLI bind and hook run with paths containing spaces', async t => {
  const { task, root, file } = await fixture({ t });
  const entry = fileURLToPath(new URL('./continuation.mjs', import.meta.url));
  await child({
    args: [entry, 'bind', '--task', task, '--chat', 'b', '--host', 'desktop'],
  });
  await fs.writeFile(
    path.join(task, 'STATUS.md'),
    '## Continuation\n- State: complete\n- Next action: run',
  );
  assert.deepEqual(
    await hook({
      event: { cwd: root, session_id: 'a', turn_id: 't', hook_event_name: 'Stop' },
    }),
    {},
  );
  await bind({ task, chat: 'a', approval: null });
  assert.equal((await read({ file })).chat, 'a');
});
test('worker waits for matching completion, then sends exactly once', async t => {
  const { task, root, file } = await fixture({ t });
  await bind({ task, chat: 'a', approval: 'v1' });
  let requests = 0;
  let starts = 0;
  let snapshots = 0;
  let closed = false;
  const host = {
    snapshot: async () => {
      snapshots++;

      return {
        threadRuntimeStatus: { type: 'idle' },
        turns: [
          {
            turnId: 'compact',
            status: 'completed',
            items: [{ type: 'contextCompaction', completed: true }],
          },
        ],
      };
    },
    compact: async () => {
      requests++;
      await hook({
        event: {
          session_id: 'a',
          cwd: root,
          hook_event_name: 'PostCompact',
          trigger: 'manual',
          turn_id: 'compact',
        },
      });
    },
    start: async () => {
      starts++;
      await hook({
        event: {
          session_id: 'a',
          cwd: root,
          hook_event_name: 'UserPromptSubmit',
          turn_id: 'resumed',
        },
      });

      return 'resumed';
    },
    close: () => {
      closed = true;
    },
  };
  await worker({ file, connect: async () => host });
  assert.equal(requests, 1);
  assert.equal(starts, 1);
  assert.ok(snapshots >= 2);
  assert.equal(closed, true);
  assert.equal((await read({ file })).compact.phase, 'resumed');
  await assert.rejects(bind({ task, chat: 'a', approval: 'v1' }), /already/);
});
test('cancellation before claim and before dispatch prevents side effects', async t => {
  for (const timing of ['claim', 'dispatch']) {
    const { task, root, file } = await fixture({ t });
    await bind({ task, chat: 'a', approval: timing });
    let snapshots = 0;
    let requests = 0;
    const cancel = () =>
      hook({
        event: {
          session_id: 'a',
          cwd: root,
          hook_event_name: 'UserPromptSubmit',
          turn_id: 'human',
        },
      });
    const host = {
      snapshot: async () => {
        snapshots++;
        if (
          (timing === 'claim' && snapshots === 1) ||
          (timing === 'dispatch' && snapshots === 2)
        ) {
          await cancel();
        }

        return {
          threadRuntimeStatus: { type: 'idle' },
          turns: [
            {
              turnId: 'compact',
              status: 'completed',
              items: [{ type: 'contextCompaction', completed: true }],
            },
          ],
        };
      },
      compact: async () => {
        requests++;
        await change({
          file,
          run: binding => {
            binding.compact.turn_id = 'compact';
          },
        });
      },
      start: async () => assert.fail('cancelled dispatch'),
      close: () => {},
    };
    await assert.rejects(worker({ file, connect: async () => host }), /cancelled/);
    assert.equal(requests, timing === 'claim' ? 0 : 1);
    assert.equal((await read({ file })).compact.phase, 'cancelled');
  }
});
test('uncertain start is never retried and remains recoverable', async t => {
  const { task, file } = await fixture({ t });
  await bind({ task, chat: 'a', approval: 'uncertain' });
  let calls = 0;
  const host = {
    snapshot: async () => ({
      threadRuntimeStatus: { type: 'idle' },
      turns: [
        {
          turnId: 'c',
          status: 'completed',
          items: [{ type: 'contextCompaction', completed: true }],
        },
      ],
    }),
    compact: async () =>
      change({
        file,
        run: b => {
          b.compact.turn_id = 'c';
        },
      }),
    start: async () => {
      calls++;
      throw new Error('uncertain');
    },
    close: () => {},
  };
  await assert.rejects(worker({ file, connect: async () => host }), /uncertain/);
  assert.equal(calls, 1);
  assert.equal((await read({ file })).compact.phase, 'dispatching');
  await assert.rejects(bind({ task, chat: 'a', approval: 'new' }), /pending/);
});

test('an old worker cannot claim a new approval after cancellation', async t => {
  const { task, root, file } = await fixture({ t });
  await bind({ task, chat: 'a', approval: 'old' });
  const host = {
    snapshot: async () => {
      await hook({
        event: {
          session_id: 'a',
          cwd: root,
          hook_event_name: 'UserPromptSubmit',
          turn_id: 'human',
        },
      });
      await bind({ task, chat: 'a', approval: 'new' });

      return {};
    },
    compact: async () => assert.fail('stale worker must not claim new approval'),
    close: () => {},
  };
  await assert.rejects(worker({ file, connect: async () => host }), /cancelled/);
  const state = await read({ file });
  assert.equal(state.compact.approval, 'new');
  assert.equal(state.compact.phase, 'starting');
});

test('delayed spawned worker is tied to its original task and approval', async t => {
  const { task, file } = await fixture({ t });
  await bind({ task, chat: 'a', approval: 'new' });
  await assert.rejects(
    worker({
      file,
      expected: { task, approval: 'old' },
      connect: async () => assert.fail('stale worker must not connect'),
    }),
    /stale worker/,
  );
  assert.equal((await read({ file })).compact.approval, 'new');
});

test('CLI parses standard string options and rejects unknown or missing values', async t => {
  const { task } = await fixture({ t });
  const result = await run({ args: ['bind', `--task=${task}`, '--chat=equals'] });
  assert.equal((await read({ file: result.binding })).task, task);
  await assert.rejects(run({ args: ['bind', '--task'] }), /argument missing/);
  await assert.rejects(run({ args: ['bind', '--unknown', 'value'] }), /Unknown option/);
  await assert.rejects(run({ args: ['bind', task] }), /Unexpected argument/);
});
