import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { PassThrough } from 'node:stream';
import { CodexCLI, connectCLI } from './codex-cli.mjs';
import { completedAndIdle } from './codex-desktop.mjs';
function fixture({ loaded }) {
  const events = new EventEmitter();
  const calls = [];
  const transport = {
    close() {},
    send(message) {
      calls.push(message);
      if (!message.id) {
        return;
      }

      let result = {};
      if (message.method === 'thread/loaded/list') {
        result = { data: loaded, nextCursor: null };
      }
      if (['thread/read', 'thread/resume'].includes(message.method)) {
        result = { thread: { id: 'current', status: { type: 'idle' } } };
      }
      if (message.method === 'turn/start') {
        result = { turn: { id: 'restored' } };
      }
      events.emit('message', { id: message.id, result });
    },
  };

  return { client: new CodexCLI({ chat: 'current', events, transport }), calls, events };
}
test('cold transcript or wrong endpoint must not resume a thread', async () => {
  const { client, calls } = fixture({ loaded: ['other'] });
  await assert.rejects(client.initialize(), /not loaded/);
  assert.equal(
    calls.some(value => value.method === 'thread/resume'),
    false,
  );
  await assert.rejects(
    connectCLI({ chat: 'current', binding: { endpoint: 'embedded' } }),
    /local daemon/,
  );
  for (const endpoint of ['ws://localhost:1234', 'wss://remote', 'unix:///tmp/custom']) {
    await assert.rejects(
      connectCLI({ chat: 'current', binding: { endpoint } }),
      /local daemon/,
    );
  }
});
test('subscribe only owned loaded thread; acknowledgement is not completion', async () => {
  const { client, calls, events } = fixture({ loaded: ['current'] });
  await client.initialize();
  assert.ok(
    calls.findIndex(value => value.method === 'thread/loaded/list') <
      calls.findIndex(value => value.method === 'thread/resume'),
  );
  await client.compact();
  assert.equal(
    completedAndIdle({ state: await client.snapshot(), turn: 'compact' }),
    false,
  );
  events.emit('message', {
    method: 'item/completed',
    params: { threadId: 'other', turnId: 'compact', item: { type: 'contextCompaction' } },
  });
  events.emit('message', {
    method: 'turn/completed',
    params: { threadId: 'current', turn: { id: 'compact', status: 'completed' } },
  });
  assert.equal(
    completedAndIdle({ state: await client.snapshot(), turn: 'compact' }),
    false,
  );
  events.emit('message', {
    method: 'item/completed',
    params: {
      threadId: 'current',
      turnId: 'compact',
      item: { type: 'contextCompaction' },
    },
  });
  assert.equal(
    completedAndIdle({ state: await client.snapshot(), turn: 'compact' }),
    true,
  );
  assert.equal(await client.start({ text: 'restore', id: 'id' }), 'restored');
  events.emit('failure', new Error('EOF'));
  await assert.rejects(client.snapshot(), /EOF/);
});
test('CLI snapshot identifies only a unique observed compaction turn', async () => {
  const { client, events } = fixture({ loaded: ['current'] });
  await client.initialize();
  await client.compact();
  assert.equal((await client.snapshot()).compactTurn, null);
  for (const turnId of ['first', 'second']) {
    events.emit('message', {
      method: 'item/completed',
      params: { threadId: 'current', turnId, item: { type: 'contextCompaction' } },
    });
    assert.equal(
      (await client.snapshot()).compactTurn,
      turnId === 'first' ? 'first' : null,
    );
  }
});

// Stub only process creation; exercise the real pipe decoder and RPC lifecycle.
test('local proxy decodes split UTF-8 and coalesced lines and owns cleanup', async t => {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let killed = false;
  child.kill = () => {
    killed = true;
  };
  const spawn = t.mock.method(childProcess, 'spawn', (command, args) => {
    assert.equal(command, 'codex');
    assert.deepEqual(args, ['app-server', 'proxy']);
    return child;
  });
  syncBuiltinESMExports();
  t.after(() => {
    spawn.mock.restore();
    syncBuiltinESMExports();
  });

  const calls = [];
  child.stdin.on('data', data => {
    const message = JSON.parse(data.toString());
    calls.push(message.method);
    if (!message.id) {
      return;
    }
    let result = {};
    if (message.method === 'thread/loaded/list') {
      result = { data: ['한글'], nextCursor: null };
    }
    if (['thread/resume', 'thread/read'].includes(message.method)) {
      result = { thread: { id: '한글', status: { type: 'idle' } } };
    }
    const output = Buffer.from('\n' + JSON.stringify({ id: message.id, result }) + '\n');
    const split = output.indexOf(Buffer.from('한')) + 1;
    child.stdout.write(output.subarray(0, split));
    child.stdout.write(output.subarray(split));
  });
  const client = await connectCLI({ chat: '한글', binding: {} });
  t.after(() => client.close());
  assert.equal((await client.snapshot()).threadRuntimeStatus.type, 'idle');
  assert.ok(calls.indexOf('thread/loaded/list') < calls.indexOf('thread/resume'));
  child.stdout.write('{broken}\n');
  await assert.rejects(client.snapshot(), SyntaxError);
  client.close();
  assert.equal(killed, true);
  assert.equal(child.stdin.destroyed, true);
});

test('local proxy startup failure closes its pipes and rejects initialization', async t => {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let killed = false;
  child.kill = () => {
    killed = true;
  };
  const spawn = t.mock.method(childProcess, 'spawn', () => {
    queueMicrotask(() => {
      child.stderr.write('daemon unavailable');
      child.emit('close', 1);
    });
    return child;
  });
  syncBuiltinESMExports();
  t.after(() => {
    spawn.mock.restore();
    syncBuiltinESMExports();
  });
  await assert.rejects(
    connectCLI({ chat: 'current', binding: {} }),
    /daemon unavailable/,
  );
  assert.equal(killed, true);
  assert.equal(child.stdin.destroyed, true);
});
