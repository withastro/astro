import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { verify } from '../dist/index.js';
import { mockExit, setup, type VerifyContext } from './test-utils.ts';

describe('verify', async () => {
	const fixture = setup();
	const baseContext = {
		version: Promise.resolve('0.0.0'),
		ref: 'latest',
		exit: mockExit,
	} satisfies Partial<VerifyContext>;

	const originalFetch = globalThis.fetch;
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	// `verify()` checks whether a template exists by making a real request to GitHub.
	// Mock `fetch` so these tests exercise `verify()`'s own logic without depending on
	// GitHub being reachable, which has caused flaky CI failures (`SocketError: other
	// side closed`) when hitting `github.com` directly.
	function mockFetch(found: boolean) {
		globalThis.fetch = mock.fn(async (input: string | URL) => {
			// Resolves the default branch for templates that don't pin a ref (e.g. Starlight examples).
			if (String(input).startsWith('https://api.github.com/')) {
				return new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 });
			}
			return new Response(null, { status: found ? 200 : 404 });
		}) as unknown as typeof fetch;
	}

	it('basics', async () => {
		mockFetch(true);
		const context: VerifyContext = { ...baseContext, template: 'basics' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});

	it('missing', async () => {
		mockFetch(false);
		const context: VerifyContext = { ...baseContext, template: 'missing' };
		let err = null;
		try {
			await verify(context);
		} catch (e) {
			err = e;
		}
		assert.equal(err, 1);
		assert.ok(!fixture.hasMessage('Template missing does not exist!'));
	});

	it('starlight', async () => {
		mockFetch(true);
		const context: VerifyContext = { ...baseContext, template: 'starlight' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});

	it('starlight/tailwind', async () => {
		mockFetch(true);
		const context: VerifyContext = { ...baseContext, template: 'starlight/tailwind' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});
});
