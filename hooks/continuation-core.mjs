// Shared decisions only: this module also runs in Claude's Mod environment.
export function continuation({ text }) {
  const fields = new Map();
  let section = false;
  let seen = false;
  let fence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence) {
      continue;
    }
    if (/^#{1,2} /.test(line)) {
      section = line === '## Continuation';
      if (section && seen) {
        throw new Error('duplicate Continuation section');
      }
      seen ||= section;
    } else if (section) {
      const match = /^- (State|Next action):\s*(.*)$/.exec(line);
      if (match) {
        if (fields.has(match[1])) {
          throw new Error(`duplicate continuation field: ${match[1]}`);
        }
        fields.set(match[1], match[2].trim());
      }
    }
  }
  return fields.get('State') === 'ready' ? fields.get('Next action') || '' : '';
}

export function pending({ compact }) {
  return ['starting', 'compacting', 'dispatching'].includes(compact?.phase);
}

export function prompt({ task, compact }) {
  const recovery = compact ? 'Record the completed compaction for this approval. Do not compact it again. ' : '';
  return `[Automated jwn continuation, not a new human instruction.] Read ${task}/STATUS.md and the entire ${task}/PLAN.md if present. Restore actual authorization, scope, host mode, pending decisions and reviews. ${recovery}Continue the saved next action only within existing authorization. Respect standalone boundaries and host Plan Mode. Update STATUS.md before stopping. Set Continuation State to waiting, blocked or complete when no authorized next action can run. Do not message another chat.`;
}

export function configure({ binding, chat, task, approval, action }) {
  if (binding.chat !== chat) {
    throw new Error('foreign session binding');
  }
  if (pending({ compact: binding.compact })) {
    throw new Error('compact pending; recover it instead of starting another');
  }
  if (!approval) {
    return binding.task === task ? binding : { chat, task, compacted_approvals: binding.compacted_approvals || [] };
  }
  if (binding.task !== task || !action) {
    throw new Error('bind owning ready task before compact');
  }
  const key = `${task}:${approval}`;
  if (binding.compacted_approvals?.includes(key)) {
    throw new Error('approval already requested compact; do not retry');
  }
  return { ...binding, compacted_approvals: [...binding.compacted_approvals || [], key], compact: { approval, phase: 'starting' } };
}

export function hookDecision({ binding, event, action }) {
  if (binding.chat !== event.session_id) {
    return null;
  }
  if (event.hook_event_name === 'UserPromptSubmit' && ['starting', 'compacting'].includes(binding.compact?.phase)) {
    binding.compact.phase = 'cancelled';
  }
  if (event.hook_event_name === 'PostCompact' && binding.compact?.phase === 'compacting' && event.trigger === 'manual') {
    binding.compact.turn_id = event.turn_id;
  }
  if (event.hook_event_name !== 'Stop' || !event.turn_id || !action || pending({ compact: binding.compact })) {
    return null;
  }
  if (binding.last_stop_turn === event.turn_id && binding.last_stop_action === action) {
    return null;
  }
  binding.last_stop_turn = event.turn_id;
  binding.last_stop_action = action;
  return { decision: 'block', reason: prompt({ task: binding.task, compact: false }) };
}
