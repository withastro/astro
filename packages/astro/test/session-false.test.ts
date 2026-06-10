import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('session: false', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/session-false/',
			output: 'server',
			adapter: testAdapter(),
			session: false,
			outDir: './dist/session-false/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function fetchResponse(routePath: string) {
		const request = new Request('http://example.com' + routePath);
		return app.render(request);
	}

	it('does not affect routes that never touch the session', async () => {
		const response = await fetchResponse('/no-session');
		assert.equal(response.status, 200);
		const body = await response.json();
		assert.deepEqual(body, { ok: true });
	});

	it('throws SessionDisabledError when a route reads Astro.session', async () => {
		const response = await fetchResponse('/api');
		assert.equal(response.status, 500);
		const body = (await response.json()) as {
			threw?: boolean;
			name?: string;
			message?: string;
		};
		assert.equal(body.threw, true, 'expected session access to throw');
		assert.equal(
			body.name,
			'SessionDisabledError',
			`expected SessionDisabledError, got ${body.name ?? '<no name>'}: ${body.message ?? ''}`,
		);
		assert.match(body.message ?? '', /session: false/);
	});

	it('does not hijack a user `./session/provider.js` import', async () => {
		const response = await fetchResponse('/user-provider');
		assert.equal(response.status, 200);
		const body = (await response.json()) as { value?: string };
		assert.equal(body.value, 'user-provider-was-not-hijacked');
	});

	it('excludes the session runtime and unstorage from the SSR bundle', async () => {
		const entries = await fixture.glob('**/*.{mjs,js,cjs}');
		let hasUnstorage = false;
		let hasSessionRuntime = false;
		for (const entry of entries) {
			const body = await fixture.readFile(entry);
			// `createStorage` is `unstorage`'s top-level export — present iff
			// `unstorage` is bundled. The runtime class is `AstroSession`.
			if (/\bcreateStorage\b/.test(body)) hasUnstorage = true;
			if (/class AstroSession\b/.test(body)) hasSessionRuntime = true;
		}
		assert.equal(hasUnstorage, false, 'unstorage should not appear in the SSR bundle');
		assert.equal(hasSessionRuntime, false, 'AstroSession class should not appear in the SSR bundle');
	});
});
