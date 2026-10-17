import * as fs from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { continuation, configure, hookDecision, prompt } from './continuation-core.mjs';
import { connectDesktop, completedAndIdle } from './codex-desktop.mjs';
import { connectCLI } from './codex-cli.mjs';

const adjacent = ({ file, suffix }) => file.slice(0, -path.extname(file).length) + suffix;
export async function read({ file }) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}
// Replace the binding atomically so readers never observe a partial JSON write.
export async function save({ file, value }) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', {
      mode: 0o600,
      flag: 'wx',
    });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

export async function locked({ file, run }) {
  // A retained directory is never stolen: its owner may still be alive.
  const lock = adjacent({ file, suffix: '.node-lock' });
  const deadline = Date.now() + 1500;
  for (;;) {
    try {
      await fs.mkdir(lock);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `continuation lock busy or retained: ${lock}; inspect owner before manual recovery`,
        );
      }
      await sleep(25);
    }
  }

  const token = randomUUID();
  try {
    await fs.writeFile(
      path.join(lock, 'owner.json'),
      JSON.stringify({ pid: process.pid, token, at: new Date().toISOString() }),
      { flag: 'wx' },
    );

    return await run();
  } finally {
    await fs.rm(lock, { recursive: true });
  }
}
// Hooks and detached workers must read, mutate and save under the same lock.
export async function change({ file, run }) {
  return locked({
    file,
    run: async () => {
      const binding = await read({ file });
      const result = await run(binding);
      await save({ file, value: binding });

      return result;
    },
  });
}

export async function record({ file, event, fields }) {
  await fs.appendFile(
    adjacent({ file, suffix: '.events.jsonl' }),
    JSON.stringify({ at: new Date().toISOString(), event, ...fields }) + '\n',
    { mode: 0o600 },
  );
}

async function taskAction({ task }) {
  if (!path.isAbsolute(task) || (await fs.realpath(task)) !== task) {
    throw new Error('missing or redirected owning task');
  }

  return continuation({ text: await fs.readFile(path.join(task, 'STATUS.md'), 'utf8') });
}
// Resolve only this chat's explicit binding, never the most recently edited task.
async function locate({ cwd, chat }) {
  let root = await fs.realpath(cwd);
  for (;;) {
    const file = path.join(root, '.jwn', '.runtime', `${chat}.json`);
    try {
      await fs.access(file);

      return file;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    const parent = path.dirname(root);
    if (parent === root) {
      return null;
    }
    root = parent;
  }
}
// Translate host lifecycle events into a decision for the bound task.
export async function hook({ event }) {
  if (!event.turn_id || !validChat({ chat: event.session_id })) {
    return {};
  }

  const file = await locate({ cwd: event.cwd || process.cwd(), chat: event.session_id });
  if (!file) {
    return {};
  }

  return change({
    file,
    run: async binding => {
      if (binding.chat !== event.session_id) {
        return {};
      }

      const action = await taskAction({ task: binding.task });
      await record({
        file,
        event: event.hook_event_name,
        fields: { turn_id: event.turn_id, trigger: event.trigger },
      });
      const result = hookDecision({ binding, event, action });
      if (result) {
        await record({
          file,
          event: 'stop_continuation',
          fields: { turn_id: event.turn_id, stop_hook_active: event.stop_hook_active },
        });
      }

      return result || {};
    },
  });
}

function validChat({ chat }) {
  return (
    typeof chat === 'string' &&
    chat !== '' &&
    !['.', '..'].includes(chat) &&
    !/[\\/:]/.test(chat)
  );
}
// Persist task ownership before scheduling any compact request.
export async function bind({ task, chat, approval, host }) {
  if (!validChat({ chat })) {
    throw new Error('current verified chat ID required');
  }
  task = await fs.realpath(task);
  if (path.basename(path.dirname(task)) !== '.jwn') {
    throw new Error('use existing .jwn/<task>/STATUS.md');
  }

  const action = await taskAction({ task });
  const file = path.join(path.dirname(task), '.runtime', `${chat}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await locked({
    file,
    run: async () => {
      let binding;
      try {
        binding = await read({ file });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        binding = { chat, task };
      }
      if (approval) {
        await fs.access(path.join(task, 'PLAN.md'));
      }

      const updated = configure({ binding, chat, task, approval, action });
      if (host && !['desktop', 'cli'].includes(host)) {
        throw new Error('unsupported continuation host');
      }
      if (approval && host && binding.host && host !== binding.host) {
        throw new Error('rebind host before compact');
      }
      updated.host = host || updated.host || 'desktop';
      // An explicit rebind adopts the local host and drops legacy remote settings.
      if (!approval) {
        delete updated.endpoint;
        delete updated.token_env;
      }
      await save({ file, value: updated });
    },
  });

  return file;
}

export async function worker({ file, connect, expected }) {
  const original = await read({ file });
  const task = original.task;
  if (
    expected &&
    (expected.task !== task || expected.approval !== original.compact?.approval)
  ) {
    throw new Error('stale worker request; do not claim another approval');
  }
  // Recheck this request under the lock before each phase-changing side effect.
  const activeCompact = async ({ binding, phase }) => {
    if (
      binding.task !== task ||
      binding.compact?.approval !== original.compact.approval ||
      binding.compact.phase !== phase ||
      !(await taskAction({ task }))
    ) {
      throw new Error(
        'compact cancelled, already claimed or owning task no longer ready',
      );
    }

    return binding.compact;
  };
  await activeCompact({ binding: original, phase: 'starting' });
  const host = await connect({ chat: original.chat, binding: original });
  try {
    // Claim this approval under the lock after the host connection is ready.
    await host.snapshot();
    await change({
      file,
      run: async binding => {
        await activeCompact({ binding, phase: 'starting' });
        binding.compact.phase = 'compacting';
      },
    });
    await record({
      file,
      event: 'compact_requested',
      fields: { approval: original.compact.approval },
    });
    await host.compact();

    // The compact RPC acknowledges delivery; only a matching completed turn
    // in an idle chat permits the recovery prompt.
    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      const binding = await read({ file });
      const compact = await activeCompact({ binding, phase: 'compacting' });
      const state = await host.snapshot();
      const compactTurn = compact.turn_id || state.compactTurn;
      if (compactTurn && completedAndIdle({ state, turn: compactTurn })) {
        // Persist dispatch intent before sending. An uncertain send is never retried.
        const id = randomUUID();
        await change({
          file,
          run: async current => {
            await activeCompact({ binding: current, phase: 'compacting' });
            current.compact.turn_id = compactTurn;
            current.compact.phase = 'dispatching';
            current.compact.completed = true;
            current.compact.client_message_id = id;
          },
        });
        await record({
          file,
          event: 'compact_completed_and_idle',
          fields: { turn_id: compactTurn },
        });
        await record({
          file,
          event: 'continuation_dispatch',
          fields: { client_message_id: id },
        });
        const turn = await host.start({ text: prompt({ task, compact: true }), id });

        // The resumed model may already have updated STATUS, so acknowledge
        // by delivery identity rather than requiring the task to remain ready.
        await change({
          file,
          run: async current => {
            if (
              current.compact?.client_message_id !== id ||
              current.compact.phase !== 'dispatching'
            ) {
              throw new Error('continuation binding changed during dispatch');
            }
            current.compact.phase = 'resumed';
            current.compact.continuation_turn = turn;
          },
        });
        await record({ file, event: 'continuation_ack', fields: { turn_id: turn } });
        return;
      }
      await sleep(500);
    }
    throw new Error('no matching completed compact in idle chat; no continuation sent');
  } finally {
    host.close();
  }
}

export async function run({ args, input }) {
  const [command, ...rest] = args;
  if (command === 'hook') {
    return hook({ event: JSON.parse(input) });
  }
  if (command === 'worker') {
    const [file, approval, task] = rest;
    if (!approval || !task) {
      throw new Error('worker requires exact task and approval');
    }
    try {
      const binding = await read({ file });
      await worker({
        file,
        connect: binding.host === 'cli' ? connectCLI : connectDesktop,
        expected: { task, approval },
      });
    } catch (error) {
      await change({
        file,
        run: async binding => {
          if (
            binding.task === task &&
            binding.compact?.approval === approval &&
            binding.compact.phase !== 'cancelled'
          ) {
            binding.compact.phase = 'error';
            binding.compact.error = error.message;
          }
        },
      });
      await record({ file, event: 'error', fields: { message: error.message } });
      throw error;
    }

    return {};
  }
  if (!['bind', 'compact'].includes(command)) {
    throw new Error('usage: node continuation.mjs bind|compact|hook|worker');
  }

  const { values: flags } = parseArgs({
    args: rest,
    options: Object.fromEntries(
      ['task', 'chat', 'approval', 'host'].map(name => [name, { type: 'string' }]),
    ),
  });
  if (!flags.task || (command === 'compact' && !flags.approval)) {
    throw new Error('save task and accepted approval before compact');
  }

  const file = await bind({
    ...flags,
    approval: command === 'compact' ? flags.approval : null,
    chat: flags.chat || process.env.CODEX_THREAD_ID,
  });
  if (command === 'bind') {
    return { binding: file };
  }
  // The hook process can exit while this worker observes compaction. Reuse
  // the running Node executable and pass the exact task/approval identity.
  const log = openSync(adjacent({ file, suffix: '.worker.log' }), 'a', 0o600);
  try {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(import.meta.url),
        'worker',
        file,
        flags.approval,
        await fs.realpath(flags.task),
      ],
      { detached: true, stdio: ['ignore', log, log], windowsHide: true },
    );
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    await record({ file, event: 'worker_started', fields: { pid: child.pid } });

    return { binding: file, worker_pid: child.pid };
  } finally {
    closeSync(log);
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    let input = '';
    if (process.argv[2] === 'hook') {
      for await (const chunk of process.stdin) {
        input += chunk;
      }
    }
    console.log(JSON.stringify(await run({ args: process.argv.slice(2), input })));
  } catch (error) {
    console.error(error.stack);
    process.exitCode = 1;
  }
}
