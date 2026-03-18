import * as assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './_test-utils.js';

describe('Svelte rune dependencies', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/svelte-rune-deps/',
		});

		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		const depDir = new URL('./node_modules/rune-dep/', fixture.config.root);
		mkdirSync(fileURLToPath(depDir), { recursive: true });
		writeFileSync(
			fileURLToPath(new URL('./package.json', depDir)),
			JSON.stringify({ name: 'rune-dep', type: 'module', exports: './index.svelte.js' }),
		);
		writeFileSync(
			fileURLToPath(new URL('./index.svelte.js', depDir)),
			`let count = $state(0);

export function getCount() {
	return count;
}
`,
		);

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
		const depDir = new URL('./node_modules/rune-dep/', fixture.config.root);
		rmSync(fileURLToPath(depDir), { recursive: true, force: true });
	});

	it('compiles .svelte.js dependencies in cloudflare dev', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);

		const html = await res.text();
		assert.ok(html.includes('Rune Count: 0'));
	});
});
