import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { StringDecoder } from 'node:string_decoder';

export class CodexCLI {
  constructor({ chat, events, transport }) {
    this.chat = chat;
    this.events = events;
    this.transport = transport;
    this.sequence = 0;
    this.compactRequested = false;
    this.compactTurns = new Map();
    this.status = { type: 'unknown' };
    this.failure = null;
    events.on('failure', error => {
      this.failure ||= error;
    });

    // Observe only this chat and only compaction events after our own request.
    events.on('message', message => {
      const p = message.params;
      if (!p || p.threadId !== chat) {
        return;
      }
      if (message.method === 'thread/status/changed') {
        this.status = p.status;
      }
      if (!this.compactRequested) {
        return;
      }
      if (message.method === 'item/completed' && p.item?.type === 'contextCompaction') {
        const turn = this.compactTurns.get(p.turnId) || { turnId: p.turnId, items: [] };
        turn.items.push({ type: 'contextCompaction', completed: true });
        this.compactTurns.set(p.turnId, turn);
      }
      if (message.method === 'turn/completed') {
        const turn = this.compactTurns.get(p.turn.id) || { turnId: p.turn.id, items: [] };
        turn.status = p.turn.status;
        this.compactTurns.set(p.turn.id, turn);
      }
    });
  }
  // Subscribe before sending because a reply can arrive immediately.
  async request({ method, params }) {
    if (this.failure) {
      throw this.failure;
    }

    const id = ++this.sequence;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.events.off('message', receive);
        this.events.off('failure', fail);
      };
      const fail = error => {
        cleanup();
        reject(error);
      };
      const receive = message => {
        if (message.id !== id) {
          return;
        }
        cleanup();
        if (message.error) {
          reject(new Error(`app-server ${method}: ${message.error.message}`));
        } else {
          resolve(message.result);
        }
      };
      const timer = setTimeout(
        () => fail(new Error(`uncertain ${method} delivery; do not retry`)),
        30000,
      );
      this.events.on('message', receive);
      this.events.on('failure', fail);
      try {
        this.transport.send({ id, method, params });
      } catch (error) {
        fail(error);
      }
    });
  }

  async initialize() {
    await this.request({
      method: 'initialize',
      params: {
        clientInfo: { name: 'jwn-continuation', version: '1' },
        capabilities: { experimentalApi: true },
      },
    });
    this.transport.send({ method: 'initialized', params: {} });

    // A disk transcript is insufficient. Do not resume until this server
    // proves it already owns the loaded thread. No alternate-server fallback.
    let cursor = null;
    let owned = false;
    do {
      const loaded = await this.request({
        method: 'thread/loaded/list',
        params: { cursor },
      });
      owned ||= loaded.data.includes(this.chat);
      cursor = loaded.nextCursor;
    } while (!owned && cursor);
    if (!owned) {
      throw new Error(
        'current thread not loaded on local daemon; remote/--no-daemon unsupported',
      );
    }

    const result = await this.request({
      method: 'thread/resume',
      params: { threadId: this.chat, excludeTurns: true },
    });
    if (result.thread?.id !== this.chat) {
      throw new Error('foreign resumed thread');
    }
    this.status = result.thread.status;
  }

  async snapshot() {
    const result = await this.request({
      method: 'thread/read',
      params: { threadId: this.chat },
    });
    if (result.thread?.id !== this.chat) {
      throw new Error('foreign thread snapshot');
    }
    this.status = result.thread.status;
    const turns = [...this.compactTurns.values()];

    // Ambiguous compaction events must not select a recovery turn.
    const compactTurns = turns.filter(turn =>
      turn.items.some(item => item.type === 'contextCompaction' && item.completed),
    );

    return {
      threadRuntimeStatus: this.status,
      turns,
      compactTurn: compactTurns.length === 1 ? compactTurns[0].turnId : null,
    };
  }

  async compact() {
    this.compactTurns.clear();
    this.compactRequested = true;
    await this.request({
      method: 'thread/compact/start',
      params: { threadId: this.chat },
    });
  }

  async start({ text, id }) {
    const result = await this.request({
      method: 'turn/start',
      params: {
        threadId: this.chat,
        input: [{ type: 'text', text, text_elements: [] }],
        clientUserMessageId: id,
      },
    });
    if (!result.turn?.id) {
      throw new Error('uncertain continuation acknowledgement; do not retry');
    }

    return result.turn.id;
  }

  close() {
    this.transport.close();
  }
}

export async function connectCLI({ chat, binding }) {
  // Old remote bindings must not silently target a different local server.
  if (binding.endpoint && binding.endpoint !== 'daemon') {
    throw new Error('only the default local daemon is supported; rebind this CLI task');
  }

  const events = new EventEmitter();
  const child = spawn('codex', ['app-server', 'proxy'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let buffer = '';
  const decoder = new StringDecoder('utf8');
  let stderr = '';
  child.stderr.on('data', data => {
    stderr = (stderr + data).slice(-4000);
  });

  // The local proxy carries JSON lines, including split UTF-8 characters.
  child.stdout.on('data', chunk => {
    buffer += decoder.write(chunk);
    for (;;) {
      const end = buffer.indexOf('\n');
      if (end === -1) {
        break;
      }

      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      if (!line.trim()) {
        continue;
      }
      try {
        events.emit('message', JSON.parse(line));
      } catch (error) {
        events.emit('failure', error);
      }
    }
  });
  child.on('error', error => events.emit('failure', error));
  child.on('close', () =>
    events.emit('failure', new Error(`app-server proxy closed: ${stderr}`)),
  );
  child.stdin.on('error', error => events.emit('failure', error));

  const client = new CodexCLI({
    chat,
    events,
    transport: {
      send: message => child.stdin.write(JSON.stringify(message) + '\n'),
      close: () => {
        child.stdin.destroy();
        child.kill();
      },
    },
  });
  try {
    await client.initialize();

    return client;
  } catch (error) {
    client.close();
    throw error;
  }
}
