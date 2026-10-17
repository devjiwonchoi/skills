import test from 'node:test';
import assert from 'node:assert/strict';
import { Duplex } from 'node:stream';
import { Desktop, completedAndIdle } from './codex-desktop.mjs';
function frame({ message }) {
  const data = Buffer.from(JSON.stringify(message)); const header = Buffer.alloc(4); header.writeUInt32LE(data.length); return Buffer.concat([header, data]);
}
function fixture({ respond }) {
  const socket = new Duplex({ read() {}, write(data, encoding, done) { respond(JSON.parse(data.subarray(4)), socket); done(); } });
  const desktop = new Desktop({ socket, chat: 'chat' }); desktop.client = 'me'; desktop.owner = 'owner'; return desktop;
}
test('completion requires matching completed item, completed turn and idle', () => {
  const state = { threadRuntimeStatus: { type: 'idle' }, turns: [{ turnId: 'c', status: 'completed', items: [{ type: 'contextCompaction', completed: true }] }] };
  assert.equal(completedAndIdle({ state, turn: 'c' }), true);
  assert.equal(completedAndIdle({ state, turn: 'wrong' }), false);
  assert.equal(completedAndIdle({ state: { ...state, threadRuntimeStatus: { type: 'running' } }, turn: 'c' }), false);
  state.turns[0].items[0].completed = false;
  assert.equal(completedAndIdle({ state, turn: 'c' }), false);
});
test('fragmented/coalesced frames and foreign snapshots', async () => {
  const desktop = fixture({ respond: (request, socket) => {
    if (request.type !== 'broadcast' || !request.params.following) { return; }
    const message = { method: 'thread-stream-state-changed', sourceClientId: 'owner', params: { conversationId: 'chat', change: { type: 'snapshot', conversationState: { wanted: true } } } };
    const frames = Buffer.concat([frame({ message: { ...message, sourceClientId: 'foreign' } }), frame({ message })]);
    socket.push(frames.subarray(0, 2)); socket.push(frames.subarray(2, 9)); socket.push(frames.subarray(9));
  } });
  assert.deepEqual(await desktop.snapshot(), { wanted: true }); desktop.close();
  assert.equal(desktop.events.listenerCount('message'), 0);
});
test('EOF rejects pending request and cleans resources', async () => {
  const desktop = fixture({ respond: (request, socket) => { socket.destroy(); } });
  await assert.rejects(desktop.compact(), /closed/); desktop.close();
  assert.equal(desktop.events.listenerCount('message'), 0);
});
test('mutations are targeted to owner, start requires acknowledgement', async () => {
  let calls = 0;
  const desktop = fixture({ respond: (request, socket) => {
    if (request.type !== 'request') { return; }
    calls++; assert.equal(request.targetClientId, 'owner');
    socket.push(frame({ message: { requestId: request.requestId, sourceClientId: 'owner', resultType: 'success', result: {} } }));
  } });
  await desktop.compact();
  await assert.rejects(desktop.start({ text: 'restore', id: 'id' }), /uncertain/);
  assert.equal(calls, 2); desktop.close();
});
