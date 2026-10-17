import test from 'node:test';
import assert from 'node:assert/strict';
import {
  continuation,
  configure,
  hookDecision,
  pending,
  prompt,
} from './continuation-core.mjs';
const ready = '## Continuation\n- State: ready\n- Next action: implement';
test('only explicit ready section supplies work; malformed duplicates fail', () => {
  assert.equal(continuation({ text: ready }), 'implement');
  for (const state of ['waiting', 'blocked', 'complete', 'unknown', '']) {
    assert.equal(continuation({ text: ready.replace('ready', state) }), '');
  }
  assert.equal(continuation({ text: '- State: ready\n- Next action: run' }), '');
  assert.equal(continuation({ text: `\`\`\`md\n${ready}\n\`\`\`` }), '');
  assert.throws(() => continuation({ text: `${ready}\n- State: ready` }), /duplicate/);
  assert.throws(() => continuation({ text: `${ready}\n${ready}` }), /duplicate/);
});
test('approval history survives rebind and prevents repeated compact', () => {
  const initial = { chat: 'a', task: '/one' };
  const compact = configure({
    binding: initial,
    chat: 'a',
    task: '/one',
    approval: 'v1',
    action: 'run',
  });
  assert.equal(pending({ compact: compact.compact }), true);
  assert.throws(
    () => configure({ binding: compact, chat: 'a', task: '/two' }),
    /pending/,
  );
  compact.compact.phase = 'resumed';
  const rebound = configure({ binding: compact, chat: 'a', task: '/two' });
  const restored = configure({ binding: rebound, chat: 'a', task: '/one' });
  assert.throws(
    () =>
      configure({
        binding: restored,
        chat: 'a',
        task: '/one',
        approval: 'v1',
        action: 'run',
      }),
    /already/,
  );
  assert.throws(
    () => configure({ binding: initial, chat: 'b', task: '/one' }),
    /foreign/,
  );
});
test('Stop deduplicates action within a host turn; cancellation persists', () => {
  const binding = { chat: 'a', task: '/task' };
  const event = { session_id: 'a', turn_id: 't', hook_event_name: 'Stop' };
  assert.equal(hookDecision({ binding, event, action: 'one' }).decision, 'block');
  assert.equal(hookDecision({ binding, event, action: 'one' }), null);
  assert.ok(hookDecision({ binding, event, action: 'two' }));
  assert.equal(hookDecision({ binding, event, action: '' }), null);
  assert.equal(
    hookDecision({ binding, event: { ...event, session_id: 'b' }, action: 'three' }),
    null,
  );
  binding.compact = { phase: 'starting' };
  assert.equal(hookDecision({ binding, event, action: 'three' }), null);
  hookDecision({
    binding,
    event: { ...event, hook_event_name: 'UserPromptSubmit' },
    action: '',
  });
  assert.equal(binding.compact.phase, 'cancelled');
  binding.compact.phase = 'dispatching';
  hookDecision({
    binding,
    event: { ...event, hook_event_name: 'UserPromptSubmit' },
    action: '',
  });
  assert.equal(binding.compact.phase, 'dispatching');
  assert.match(prompt({ task: '/task', compact: true }), /Do not compact it again/);
});

test('example fences close only with the same marker and enough characters', () => {
  for (const [open, nested, close] of [
    ['```markdown', '~~~', '```'],
    ['~~~~markdown', '~~~', '~~~~'],
    ['````markdown', '```', '````'],
    ['~~~markdown', '```', '~~~'],
    ['```markdown', '```still code', '```'],
    ['~~~markdown', '~~~~still code', '~~~'],
    ['```markdown', '~~~', '`````'],
  ]) {
    const example = [
      open,
      nested,
      '## Continuation',
      '- State: ready',
      '- Next action: fabricated example',
      close,
    ].join('\n');
    const status = `${example}\n## Continuation\n- State: waiting\n- Next action: actual task`;
    assert.equal(continuation({ text: status }), '', open);
    assert.equal(
      continuation({ text: status.replace('- State: waiting', '- State: ready') }),
      'actual task',
      open,
    );
  }
});
