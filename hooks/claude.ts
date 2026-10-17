import type { EngineInterface, On } from 'claude-code';
import { continuation, configure, pending, prompt } from './continuation-core.mjs';

// Extend the host's MCP event union with this plugin's registered tool contract.
declare module 'claude-code' {
  interface McpToolInputs {
    mcp__jwn__jwn_continuation: {
      operation: 'bind' | 'compact';
      task: string;
      approval?: string;
    };
  }
}

// Only our scheduling metadata lives here; host events and methods use official types.
export type Binding = {
  chat: string;
  task: string;
  generation: number;
  compacted_approvals?: string[];
  compact?: { approval: string; phase: string; completed?: boolean };
  delivery?: { text: string; generation: number; compact: boolean } | null;
  last_action?: string | null;
  last_stop_turn?: string;
  superseded_turn?: string;
  error?: string;
};

// No Node APIs: Claude loads this Mod in CLI and local Desktop Code sessions.
// Serialize metadata mutations while keeping compaction and prompt submission
// outside the queue, where human input can invalidate pending work.
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(run: () => Promise<T>) => {
  const result = queue.then(run);
  queue = result.catch(() => {});

  return result;
};
const key = async ($: EngineInterface) => `continuation:${await $.session.id()}`;
const load = async ($: EngineInterface) =>
  (await $.store.get(await key($))) as Binding | undefined;
const save = async ($: EngineInterface, state: Binding) =>
  $.store.set(await key($), state);
const action = async ($: EngineInterface, state: Pick<Binding, 'task'>) => {
  const stat = await $.fs.stat(state.task, { resolve: true });
  if (stat.realPath?.replace(/\\/g, '/') !== state.task) {
    throw new Error('owning task redirected or missing');
  }

  return continuation({ text: await $.fs.read(`${state.task}/STATUS.md`) });
};
const report = async ($: EngineInterface, error: Error) => {
  await $.ui.log(`jwn continuation stopped: ${error.message}`);
};

// Claim one root-turn action, then recheck its generation after compaction.
async function advance($: EngineInterface, turn: string, generation: number) {
  const work = await serial(async () => {
    const state = await load($);
    if (
      !state ||
      state.chat !== (await $.session.id()) ||
      state.generation !== generation
    ) {
      return null;
    }

    const next = await action($, state);
    if (
      !next ||
      (pending({ compact: state.compact }) && state.compact?.phase !== 'starting')
    ) {
      return null;
    }

    const compact = state.compact?.phase === 'starting';
    if (!compact && state.last_action === next) {
      return null;
    }
    // Each claimed action owns a generation, including consecutive automated turns.
    // A delayed receipt must not cancel a later action in the same session.
    state.generation += 1;
    state.last_action = next;
    state.last_stop_turn = turn;
    if (state.compact?.phase === 'starting') {
      state.compact.phase = 'compacting';
    }
    await save($, state);

    return { task: state.task, generation: state.generation, compact };
  });
  if (!work) {
    return;
  }
  try {
    if (work.compact) {
      const result = await $.session.compact({
        instructions: prompt({ task: work.task, compact: true }),
      });
      if ('skip' in result || !Array.isArray(result.messages)) {
        throw new Error(
          `compaction did not complete: ${result.skip || 'missing messages'}`,
        );
      }
    }

    const text = await serial(async () => {
      const state = await load($);
      if (
        !state ||
        state.task !== work.task ||
        state.generation !== work.generation ||
        !(await action($, state))
      ) {
        return null;
      }
      if (work.compact && state.compact?.phase !== 'compacting') {
        return null;
      }

      const token = `${work.generation}:${state.last_stop_turn}`;
      const text = `${prompt({ task: work.task, compact: work.compact })}\n[jwn delivery ${token}]`;
      state.delivery = { text, generation: work.generation, compact: work.compact };
      if (work.compact && state.compact) {
        state.compact.phase = 'dispatching';
        state.compact.completed = true;
      }
      await save($, state);

      return text;
    });
    if (text) {
      // Do not hold the mutation queue while prompt.submit re-enters our hook.
      await $.prompt.submit({ text });
    }
  } catch (error) {
    await serial(async () => {
      const state = await load($);
      if (state?.task === work.task && state.generation === work.generation) {
        state.error = (error as Error).message;
        if (state.compact && pending({ compact: state.compact })) {
          state.compact.phase = 'error';
        }
        state.delivery = null;
        await save($, state);
      }
    });
    throw error;
  }
}

export function register(on: On) {
  on('session.start', async ($, e, next) => {
    const { version } = await $.session.version();
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
    if (
      !match ||
      Number(match[1]) < 2 ||
      (Number(match[1]) === 2 &&
        (Number(match[2]) < 1 || (Number(match[2]) === 1 && Number(match[3]) < 286)))
    ) {
      throw new Error('jwn requires Claude Code Mods 2.1.286+');
    }
    // The tool records a request; turn.complete executes it between model turns.
    await $.tool.register({
      name: 'jwn_continuation',
      description:
        'Bind this session to its authorized .jwn task, or request one compact for an accepted Plan version. Save STATUS/PLAN authority first. Compact runs after this root turn ends.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { enum: ['bind', 'compact'] },
          task: { type: 'string' },
          approval: { type: 'string' },
        },
        required: ['operation', 'task'],
        additionalProperties: false,
      },
    });

    return next(e);
  });

  on('tool.call', { tool: 'mcp__jwn__jwn_continuation' }, async ($, e) => {
    if (e.agentId) {
      return { deny: 'only the owning root session may bind or compact' };
    }

    return serial(async () => {
      if (!['bind', 'compact'].includes(e.operation) || typeof e.task !== 'string') {
        throw new Error('expected bind or compact with owning task');
      }

      const task = e.task.replace(/\\/g, '/').replace(/\/$/, '');
      if (!/^(?:\/|[A-Za-z]:\/)/.test(task) || !/\/\.jwn\/[^/]+$/.test(task)) {
        throw new Error('use absolute existing .jwn/<task>');
      }

      const chat = await $.session.id();
      const old = (await load($)) || { chat, task, generation: 0 };
      const nextAction = await action($, { task });
      if (e.operation === 'compact') {
        if (typeof e.approval !== 'string' || !e.approval.trim()) {
          throw new Error('accepted Plan approval ID required');
        }
        await $.fs.read(`${task}/PLAN.md`);
      }

      const state: Binding = configure({
        binding: old,
        chat,
        task,
        action: nextAction,
        approval: e.operation === 'compact' ? e.approval : null,
      });
      state.generation = (old.generation || 0) + 1;
      state.delivery = null;
      state.last_action = null;
      await save($, state);

      return {
        result: { task, operation: e.operation, compact: state.compact?.phase || null },
      };
    });
  }).catch(($, e, next) => {
    return { deny: next.error.message || 'continuation check failed' };
  });

  // Validate our attributed delivery at the final submission boundary. Every
  // other prompt invalidates older queued work before it can resume the model.
  on('prompt.submit', async ($, e, next) => {
    const own = e.origin?.kind === 'plugin' && e.origin.name === $.plugin.name;
    const decision = await serial(async () => {
      const state = await load($);
      if (!state) {
        return own ? { drop: 'unbound jwn continuation' } : null;
      }
      if (own) {
        const delivery = state.delivery;
        if (
          !delivery ||
          delivery.text !== e.text ||
          delivery.generation !== state.generation ||
          !(await action($, state))
        ) {
          return { drop: 'stale or unauthorized jwn continuation' };
        }
        state.delivery = null;
        if (delivery.compact && state.compact) {
          state.compact.phase = 'resumed';
        }
        await save($, state);

        return null;
      }
      state.generation = (state.generation || 0) + 1;
      if (e.turnId) {
        state.superseded_turn = e.turnId;
      }
      state.delivery = null;
      state.last_action = null;
      if (state.compact && pending({ compact: state.compact })) {
        state.compact.phase = 'cancelled';
      }
      await save($, state);

      return null;
    });

    return decision || next(e);
  }).catch(($, e, next) => {
    if (e.origin?.kind === 'plugin' && e.origin.name === $.plugin.name) {
      return { drop: `jwn continuation check failed: ${next.error.message}` };
    }
    throw new Error(next.error.message);
  });

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      return next(e);
    }
    // next(e) can yield to a newer prompt. Keep this completion's generation
    // before that boundary, and ignore a turn superseded by queued input.
    const generation = await serial(async () => {
      const state = await load($);

      return state?.superseded_turn === e.turnId ? null : state?.generation;
    });
    const result = await next(e);
    if (generation === null || generation === undefined) {
      return result;
    }
    if (e.isAborted || e.reason !== 'answer') {
      await serial(async () => {
        const state = await load($);
        if (state && state.generation === generation) {
          state.generation = (state.generation || 0) + 1;
          state.delivery = null;
          if (state.compact && pending({ compact: state.compact })) {
            state.compact.phase = 'cancelled';
          }
          await save($, state);
        }
      });

      return result;
    }
    // Host timers survive this handler, but cannot inherit a newer user prompt.
    $.clock.after(0, () => {
      void advance($, e.turnId, generation).catch(error => report($, error));
    });

    return result;
  });
}
