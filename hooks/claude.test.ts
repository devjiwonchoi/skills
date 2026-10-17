import type {
  On,
  TurnCompleteInput,
  SessionCompactResult,
  PromptSubmitInput,
  PromptSubmitResult,
} from 'claude-code';
import type { Engine } from 'claude-code/testing';
import type { Binding } from './claude';
import { expect, mock, test } from 'claude-code/testing';

const task = '/project/.jwn/task';
const ready = '## Continuation\n- State: ready\n- Next action: one';

// The real engine loads our module and dispatches every hook. Stub only the
// outside world; use the official clock rather than reproducing its scheduling.
function fixture({
  $,
  on,
  initial,
  submit,
}: {
  $: Engine;
  on: On;
  initial?: Binding;
  submit?: (request: {
    event: PromptSubmitInput;
    deliver: () => Promise<PromptSubmitResult>;
  }) => Promise<PromptSubmitResult>;
}) {
  const clock = mock.clock(on);
  let state = initial;
  let status = ready;
  let compactResult: SessionCompactResult | Promise<SessionCompactResult> = {
    messages: [{ role: 'user', text: 'compacted summary', toolUses: [] }],
  };
  let compactCalls = 0;
  let duringComplete: (() => Promise<void>) | null = null;
  const submissions: Pick<PromptSubmitInput, 'text' | 'origin'>[] = [];
  const errors: string[] = [];

  // mock.store has no inspection handle. The documented get/set stubs expose
  // saved metadata for assertions while the engine still owns dispatch.
  on('store.get', ($, e) => {
    expect(e.key).toBe('continuation:session');
    return { value: structuredClone(state) };
  });
  on('store.set', ($, e) => {
    expect(e.key).toBe('continuation:session');
    state = structuredClone(e.value) as Binding;

    return { value: undefined };
  });
  on('session.id', () => ({ value: 'session' }));
  on('session.version', () => ({ value: { version: '2.1.299' } }));
  on('session.start', () => ({ cwd: '/project' }));
  on('fs.stat', ($, e) => ({
    value: { kind: 'dir', realPath: e.path, size: 0, mtimeMs: 0, isLink: false },
  }));
  on('fs.read', ($, e) => ({
    value: e.path.endsWith('STATUS.md') ? status : 'approved plan',
  }));
  on('tool.register', () => ({ value: { tool: 'mcp__jwn__jwn_continuation' } }));
  on('turn.complete', async () => {
    await duringComplete?.();

    return { text: '' };
  });
  on('session.compact', async () => {
    compactCalls++;

    return await compactResult;
  });
  // A stub answers the API call, but does not run core's idle delivery.
  // Re-enter that lifecycle boundary through the official test engine.
  let delivering = false;
  on('prompt.submit', async (host, e) => {
    if (e.origin.kind === 'plugin' && !delivering) {
      const deliver = async () => {
        delivering = true;
        try {
          return await $.prompt.submit(e);
        } finally {
          delivering = false;
        }
      };
      return submit ? await submit({ event: e, deliver }) : await deliver();
    }
    if (e.origin.kind === 'plugin') {
      submissions.push({ text: e.text, origin: e.origin });
    }
    return { text: e.text, origin: e.origin };
  });
  on('ui.log', ($, e) => {
    errors.push(e.text);

    return { value: undefined };
  });

  const tool = ({
    operation,
    approval,
    agentId,
  }: {
    operation: 'bind' | 'compact';
    approval?: string;
    agentId?: string;
  }) =>
    $.tool.call({
      tool: 'mcp__jwn__jwn_continuation',
      operation,
      task,
      approval,
      agentId,
    });
  const finish = (event?: Partial<TurnCompleteInput>) =>
    $.turn.complete({
      answer: '',
      durationMs: 0,
      turnId: 'root',
      reason: 'answer',
      isAborted: false,
      ...event,
    } as TurnCompleteInput);
  const human = (event?: { turnId?: string; wait?: boolean }) =>
    $.prompt.submit({
      text: 'new instruction',
      origin: { kind: 'composer' },
      wait: false,
      ...event,
    });

  return {
    clock,
    submissions,
    errors,
    tool,
    finish,
    human,
    state: () => {
      if (!state) {
        throw new Error('expected a saved session binding');
      }
      return state;
    },
    compactCalls: () => compactCalls,
    setStatus: (text: string) => {
      status = text;
    },
    setCompact: (result: typeof compactResult) => {
      compactResult = result;
    },
    duringComplete: (run: () => Promise<void>) => {
      duringComplete = run;
    },
    start: async () => {
      await $.session.start({
        surface: 'terminal',
        isInteractive: true,
        cwd: '/project',
      });
      expect(await tool({ operation: 'bind' })).toEqual({
        result: { task, operation: 'bind', compact: null },
      });
    },
  };
}

test('compact waits for root completion, restores once with plugin attribution, and advances ready work', async ($, on) => {
  const f = fixture({ $, on });
  await f.start();
  await f.tool({ operation: 'compact', approval: 'v1' });
  expect(f.compactCalls()).toBe(0);
  await f.finish({ agentId: 'child' });
  await f.clock.settle();
  expect(f.compactCalls()).toBe(0);
  await f.finish();
  await f.clock.settle();
  expect(f.compactCalls()).toBe(1);
  expect(f.submissions.length).toBe(1);
  expect(f.submissions[0].origin).toEqual({ kind: 'plugin', name: 'jwn' });
  expect(f.submissions[0].text).toContain('Do not compact it again');
  expect(f.state().compact?.phase).toBe('resumed');
  expect(await f.tool({ operation: 'compact', approval: 'v1' })).toEqual(
    expect.objectContaining({ deny: expect.stringContaining('already') }),
  );
  await f.finish({ turnId: 'automated' });
  await f.clock.settle();
  expect(f.submissions.length).toBe(1);
  f.setStatus('## Continuation\n- State: ready\n- Next action: two');
  await f.finish({ turnId: 'advanced' });
  await f.clock.settle();
  expect(f.submissions.length).toBe(2);
  expect(f.errors).toEqual([]);
});

for (const reason of ['skip', 'aborted', 'error', 'refusal'] as const) {
  test(`${reason} cannot count as completed compaction`, async ($, on) => {
    const f = fixture({ $, on });
    await f.start();
    await f.tool({ operation: 'compact', approval: reason });
    if (reason === 'skip') {
      f.setCompact({ skip: 'busy' });
    }
    await f.finish({
      reason: reason === 'skip' ? 'answer' : reason,
      isAborted: reason === 'aborted',
      ...(reason === 'refusal' ? { refusal: { category: null, explanation: null } } : {}),
    });
    await f.clock.settle();
    expect(f.submissions.length).toBe(0);
    expect(f.state().compact?.completed).not.toBe(true);
    if (reason === 'skip') {
      expect(f.errors.length).toBe(1);
    }
  });
}

test('human input during compaction cancels pending recovery', async ($, on) => {
  const f = fixture({ $, on });
  let resolve!: (result: SessionCompactResult) => void;
  f.setCompact(
    new Promise(done => {
      resolve = done;
    }),
  );
  await f.start();
  await f.tool({ operation: 'compact', approval: 'race' });
  await f.finish();
  await f.clock.settle();
  expect(f.compactCalls()).toBe(1);
  await f.human();
  resolve({ messages: [{ role: 'user', text: 'compacted summary', toolUses: [] }] });
  await f.clock.settle();
  expect(f.submissions.length).toBe(0);
  expect(f.state().compact?.phase).toBe('cancelled');
});

test('delivery gate rejects an already queued prompt after human input', async ($, on) => {
  const text = 'previously queued attributed prompt';
  const f = fixture({
    $,
    on,
    initial: {
      chat: 'session',
      task,
      generation: 1,
      delivery: { text, generation: 1, compact: false },
    },
  });
  await f.human();
  const result = await $.prompt.submit({
    text,
    wait: false,
    origin: { kind: 'plugin', name: 'jwn' },
  });
  expect(result).toEqual({ drop: 'stale or unauthorized jwn continuation' });
  expect(f.submissions.length).toBe(0);
});

test('terminal tasks never resume', async ($, on) => {
  const f = fixture({ $, on });
  await f.start();
  for (const state of ['waiting', 'blocked', 'complete']) {
    f.setStatus(`## Continuation\n- State: ${state}\n- Next action: two`);
    await f.finish();
    await f.clock.settle();
  }

  expect(f.submissions.length).toBe(0);
});

test('subagents cannot bind and saved approval history survives module reload', async ($, on) => {
  // A freshly loaded module receives the host-owned store from a prior run.
  const f = fixture({
    $,
    on,
    initial: {
      chat: 'session',
      task,
      generation: 2,
      compacted_approvals: [`${task}:v1`],
      compact: { approval: 'v1', phase: 'resumed', completed: true },
    },
  });
  expect(await f.tool({ operation: 'bind', agentId: 'child' })).toEqual({
    deny: 'only the owning root session may bind or compact',
  });
  expect(await f.tool({ operation: 'compact', approval: 'v1' })).toEqual(
    expect.objectContaining({ deny: expect.stringContaining('already') }),
  );
});

test('input before the background timer invalidates its completion', async ($, on) => {
  const f = fixture({ $, on });
  await f.start();
  await f.finish();
  await f.human();
  await f.clock.settle();
  expect(f.submissions.length).toBe(0);
});

test('input during next(turn.complete) cannot authorize an old timer', async ($, on) => {
  const f = fixture({ $, on });
  f.duringComplete(async () => {
    await f.human();
  });
  await f.start();
  await f.finish();
  await f.clock.settle();
  expect(f.submissions.length).toBe(0);
});

test('late aborted completion cannot cancel a newer approved compact', async ($, on) => {
  const f = fixture({ $, on });
  f.duringComplete(async () => {
    await f.human();
    await f.tool({ operation: 'compact', approval: 'new-approval' });
  });
  await f.start();
  await f.finish({ reason: 'aborted', isAborted: true });
  await f.clock.settle();
  expect(f.state().compact?.approval).toBe('new-approval');
  expect(f.state().compact?.phase).toBe('starting');
  expect(f.compactCalls()).toBe(0);
});

test('queued input supersedes its old root turn and allows a later fresh turn', async ($, on) => {
  const f = fixture({ $, on });
  await f.start();
  await f.human({ turnId: 'root', wait: true });
  await f.finish();
  await f.clock.settle();
  expect(f.submissions.length).toBe(0);
  await f.finish({ turnId: 'new-root' });
  await f.clock.settle();
  expect(f.submissions.length).toBe(1);
});

test('unrelated tools retain their normal result', async ($, on) => {
  const f = fixture({ $, on });
  on('tool.call', () => ({ result: 'ordinary tool result' }));
  await f.start();
  expect(await $.tool.call({ tool: 'Bash', command: 'stubbed, never executed' })).toEqual(
    { result: 'ordinary tool result' },
  );
});

test('a late failed receipt cannot erase the next automated turn delivery', async ($, on) => {
  let requests = 0;
  let rejectFirst: (error: Error) => void = () => {
    throw new Error('first prompt was not accepted');
  };
  let deliverNext: () => Promise<PromptSubmitResult> = async () => {
    throw new Error('next prompt was not queued');
  };
  const f = fixture({
    $,
    on,
    submit: async ({ deliver }) => {
      if (++requests === 1) {
        // The model can finish the next turn before another plugin returns this receipt.
        await deliver();
        return new Promise((resolve, reject) => {
          rejectFirst = reject;
        });
      }
      return new Promise(resolve => {
        deliverNext = async () => {
          const result = await deliver();
          resolve(result);
          return result;
        };
      });
    },
  });
  await f.start();
  await f.finish({ turnId: 'first' });
  await f.clock.settle();
  expect(f.submissions.length).toBe(1);
  f.setStatus('## Continuation\n- State: ready\n- Next action: second');
  await f.finish({ turnId: 'second' });
  await f.clock.settle();
  const pendingText = f.state().delivery?.text;
  expect(pendingText).toContain('jwn delivery');
  rejectFirst(new Error('late receipt failure'));
  await f.clock.settle();
  expect(f.state().delivery?.text).toBe(pendingText);
  expect((await deliverNext()).drop).toBe(undefined);
  await f.clock.settle();
  expect(f.submissions.length).toBe(2);
});

test('a fenced example cannot resume a waiting task', async ($, on) => {
  const f = fixture({ $, on });
  await f.start();
  f.setStatus(
    [
      '```markdown',
      '~~~',
      '## Continuation',
      '- State: ready',
      '- Next action: fabricated example',
      '```',
      '## Continuation',
      '- State: waiting',
      '- Next action: actual task',
    ].join('\n'),
  );
  await f.finish();
  await f.clock.settle();
  expect(f.submissions.length).toBe(0);
  expect(f.errors).toEqual([]);
});
