import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

export function completedAndIdle({ state, turn }) {
  const turns = [...state.turns || [], ...Object.values(state.turnHistory?.history?.entitiesByKey || {})];
  return state.threadRuntimeStatus?.type === 'idle' && turns.some(value => value.turnId === turn && value.status === 'completed' && value.items?.some(item => item.type === 'contextCompaction' && item.completed === true));
}

export class Desktop {
  constructor({ socket, chat }) {
    this.socket = socket;
    this.chat = chat;
    this.client = 'initializing-client';
    this.events = new EventEmitter();
    this.buffer = Buffer.alloc(0);
    this.failure = null;
    socket.on('data', chunk => {
      try {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        while (this.buffer.length >= 4) {
          const size = this.buffer.readUInt32LE();
          if (size > 268435456) {
            throw new Error('desktop IPC frame exceeds host limit');
          }
          if (this.buffer.length < size + 4) {
            break;
          }
          const message = JSON.parse(this.buffer.subarray(4, size + 4));
          this.buffer = this.buffer.subarray(size + 4);
          this.events.emit('message', message);
        }
      } catch (error) {
        this.fail({ error });
        socket.destroy();
      }
    });
    socket.on('error', error => this.fail({ error }));
    socket.on('close', () => this.fail({ error: new Error('desktop IPC closed') }));
  }

  fail({ error }) {
    this.failure ||= error;
    this.events.emit('failure', this.failure);
  }

  wait({ match, send, timeout }) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.events.off('message', receive);
        this.events.off('failure', fail);
      };
      const fail = error => { cleanup(); reject(error); };
      const receive = message => {
        if (match(message)) {
          cleanup();
          resolve(message);
        }
      };
      const timer = setTimeout(() => fail(new Error('uncertain IPC delivery or snapshot timeout; do not retry mutations')), timeout);
      this.events.on('message', receive);
      this.events.on('failure', fail);
      if (this.failure) {
        fail(this.failure);
        return;
      }
      try {
        send();
      } catch (error) {
        fail(error);
      }
    });
  }

  send({ message }) {
    const data = Buffer.from(JSON.stringify(message));
    const size = Buffer.alloc(4);
    size.writeUInt32LE(data.length);
    this.socket.write(Buffer.concat([size, data]));
  }

  async request({ method, params, version }) {
    const requestId = randomUUID();
    const response = await this.wait({
      timeout: 30000,
      match: message => message.requestId === requestId && (!this.owner || message.sourceClientId === this.owner || message.handledByClientId === this.owner),
      send: () => this.send({ message: { type: 'request', requestId, sourceClientId: this.client, ...(this.owner ? { targetClientId: this.owner } : {}), method, params, version } }),
    });
    if (response.resultType !== 'success') {
      throw new Error(`IPC ${method} failed: ${JSON.stringify(response)}`);
    }
    return response;
  }

  follow({ enabled }) {
    this.send({ message: { type: 'broadcast', sourceClientId: this.client, method: 'thread-stream-following-changed', version: 1, targetClientIds: [this.owner], params: { conversationId: this.chat, hostId: 'local', following: enabled } } });
  }

  async snapshot() {
    const message = await this.wait({
      timeout: 20000,
      match: message => message.sourceClientId === this.owner && message.method === 'thread-stream-state-changed' && message.params?.conversationId === this.chat && message.params.change?.type === 'snapshot',
      send: () => this.follow({ enabled: true }),
    });
    return message.params.change.conversationState;
  }

  async compact() {
    await this.request({ method: 'thread-follower-compact-thread', params: { conversationId: this.chat }, version: 1 });
  }

  async start({ text, id }) {
    const response = await this.request({ method: 'thread-follower-start-turn', version: 2, params: { conversationId: this.chat, turnStart: { request: { threadId: this.chat, clientUserMessageId: id, input: [{ type: 'text', text, text_elements: [] }] }, context: { inheritThreadSettings: true } } } });
    const turn = response.result?.result?.turn?.id;
    if (!turn) {
      throw new Error('uncertain continuation acknowledgement; do not retry');
    }
    return turn;
  }

  close() {
    if (this.owner && !this.socket.destroyed) {
      this.follow({ enabled: false });
    }
    this.socket.destroy();
  }
}

export async function connectDesktop({ chat }) {
  const address = process.platform === 'win32' ? '\\\\.\\pipe\\codex-ipc' : path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'ipc', 'ipc.sock');
  const socket = net.createConnection(address);
  const desktop = new Desktop({ socket, chat });
  try {
    const initialized = await desktop.request({ method: 'initialize', params: { clientType: 'cli' }, version: 0 });
    desktop.client = initialized.result?.clientId;
    if (!desktop.client) {
      throw new Error('missing IPC client ID');
    }
    const discovered = await desktop.request({ method: 'thread-owner-discovery', params: { conversationId: chat, hostId: 'local' }, version: 1 });
    desktop.owner = discovered.handledByClientId;
    if (!desktop.owner) {
      throw new Error('no current chat owner');
    }
    return desktop;
  } catch (error) {
    desktop.close();
    throw error;
  }
}
