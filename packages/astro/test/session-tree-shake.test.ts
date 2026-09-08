import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

// `createStorage` is `unstorage`'s top-level export — present iff `unstorage`
// is bundled. The runtime class is `AstroSession`.
async function bundleHasSessionRuntime(fixture: Fixture) {
	const entries = await fixture.glob('**/*.{mjs,js,cjs}');
	let hasUnstorage = false;
	let hasSessionRuntime = false;
	for (const entry of entries) {
		const body = await fixture.readFile(entry);
		if (/\bcreateStorage\b/.test(body)) hasUnstorage = true;
		if (/class AstroSession\b/.test(body)) hasSessionRuntime = true;
	}
	return { hasUnstorage, hasSessionRuntime };
}

describe('session tree-shaking when no driver is wired', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		// No `session` config and an adapter that does not wire a default
		// driver — the same "no sessions" state as before this feature.
		fixture = await loadFixture({
			root: './fixtures/session-tree-shake/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/session-tree-shake-no-driver/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('leaves Astro.session undefined', async () => {
		const response = await app.render(new Request('http://example.com/api'));
		assert.equal(response.status, 200);
		const body = (await response.json()) as { hasSession?: boolean };
		assert.equal(body.hasSession, false, 'expected context.session to be undefined');
	});

	it('does not affect routes that never touch the session', async () => {
		const response = await app.render(new Request('http://example.com/no-session'));
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), { ok: true });
	});

	it('excludes the session runtime and unstorage from the SSR bundle', async () => {
		const { hasUnstorage, hasSessionRuntime } = await bundleHasSessionRuntime(fixture);
		assert.equal(hasUnstorage, false, 'unstorage should not appear in the SSR bundle');
		assert.equal(
			hasSessionRuntime,
			false,
			'AstroSession class should not appear in the SSR bundle',
		);
	});
});

describe('session runtime is retained when a driver is configured', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		// A configured driver must keep the runtime in the bundle — guards
		// against the provider swap over-shaking real session setups.
		fixture = await loadFixture({
			root: './fixtures/session-tree-shake/',
			output: 'server',
			adapter: testAdapter(),
			session: {
				// @ts-expect-error: the default type of the TDriver in AstroUserConfig must be changed so that this can pass
				driver: 'fs',
			},
			outDir: './dist/session-tree-shake-with-driver/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('makes Astro.session available', async () => {
		const response = await app.render(new Request('http://example.com/api'));
		assert.equal(response.status, 200);
		const body = (await response.json()) as { hasSession?: boolean };
		assert.equal(body.hasSession, true, 'expected context.session to be defined');
	});

	it('keeps the session runtime and unstorage in the SSR bundle', async () => {
		const { hasUnstorage, hasSessionRuntime } = await bundleHasSessionRuntime(fixture);
		assert.equal(hasUnstorage, true, 'unstorage should appear in the SSR bundle');
		assert.equal(hasSessionRuntime, true, 'AstroSession class should appear in the SSR bundle');
	});
});
