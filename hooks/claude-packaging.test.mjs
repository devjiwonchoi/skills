import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('host registrations isolate Claude from external Node scheduling', async () => {
  const defaults = JSON.parse(await readFile(new URL('./hooks.json', import.meta.url)));
  const codex = JSON.parse(
    await readFile(new URL('../.codex-plugin/plugin.json', import.meta.url)),
  );
  const codexHooks = JSON.parse(
    await readFile(new URL('./codex-hooks.json', import.meta.url)),
  );
  assert.deepEqual(defaults.modules, ['./claude.ts']);
  assert.deepEqual(Object.keys(defaults.hooks), ['SessionStart']);
  assert.equal(codex.hooks, './hooks/codex-hooks.json');
  assert.ok(codexHooks.hooks.Stop);
  assert.equal(codexHooks.modules, undefined);
  const source = await readFile(new URL('./claude.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|process\.|setTimeout/);
});
