import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../test-utils.js';

type Fixture = Awaited<ReturnType<typeof loadFixture>>;
type DevServer = NonNullable<Awaited<ReturnType<Fixture['startDevServer']>>>;

describe('endpoint responses', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/endpoint-routing/',
		});
		const startedDevServer = await fixture.startDevServer();
		assert.ok(startedDevServer);
		devServer = startedDevServer;
	});

	after(async () => {
		await devServer.stop();
	});

	it('Headers with multiple values (set-cookie special case)', async () => {
		const res = await fixture.fetch('/multi-headers');
		assert.equal(res.headers.get('x-single'), 'single');
		assert.equal(res.headers.get('x-triple'), 'one, two, three');
		// set-cookie is exposed via getSetCookie() in the fetch API
		const setCookies = res.headers.getSetCookie();
		assert.ok(setCookies.includes('hello'), 'Should contain hello cookie');
		assert.ok(setCookies.includes('world'), 'Should contain world cookie');
	});

	it('Can bail on streaming', async () => {
		const controller = new AbortController();

		// Start fetching the streaming endpoint
		const resPromise = fixture.fetch('/streaming', { signal: controller.signal });

		// Wait briefly then abort
		await new Promise((resolve) => setTimeout(resolve, 500));
		controller.abort();

		// The request should be aborted without throwing unhandled errors
		try {
			await resPromise;
		} catch (err: unknown) {
			// AbortError is expected
			assert.ok(err instanceof Error && err.name === 'AbortError', 'Expected an AbortError');
		}
	});

	it('Accept setCookie from both context and headers', async () => {
		const res = await fixture.fetch('/setCookies');
		const setCookies = res.headers.getSetCookie();
		assert.ok(
			setCookies.some((cookie) => cookie.startsWith('key1=value1')),
			'Should contain key1 cookie',
		);
		assert.ok(
			setCookies.some((cookie) => cookie.startsWith('key2=value2')),
			'Should contain key2 cookie',
		);
		assert.ok(
			setCookies.some((cookie) => cookie.startsWith('key3=value3')),
			'Should contain key3 cookie',
		);
		assert.ok(
			setCookies.some((cookie) => cookie.startsWith('key4=value4')),
			'Should contain key4 cookie',
		);
	});
});
