import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { memoryCache } from '../dist/config/entrypoint.js';
import testAdapter from './test-adapter.ts';
import { type App, loadFixture } from './test-utils.ts';

describe('cache directives from compiled async layouts (#18499)', () => {
	let cdn: App;
	let nonStreamingCdn: App;
	let runtime: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/cache-streaming/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
		cdn = await fixture.loadTestAdapterApp();
		nonStreamingCdn = await fixture.loadTestAdapterApp(false);

		const runtimeFixture = await loadFixture({
			root: './fixtures/cache-streaming/',
			output: 'server',
			adapter: testAdapter(),
			cache: { provider: memoryCache() },
			outDir: './dist/runtime/',
		});
		await runtimeFixture.build();
		runtime = await runtimeFixture.loadTestAdapterApp();
	});

	it('CDN streaming has only early tags (documented limitation)', async () => {
		const response = await cdn.render(new Request('http://example.com/'));
		assert.equal(response.headers.get('Cache-Tag'), 'route-rule, page');
		assert.match(await response.text(), /cache streaming/);
	});

	it('non-streaming CDN headers include layout and sync child tags', async () => {
		const response = await nonStreamingCdn.render(new Request('http://example.com/'));
		assert.equal(response.headers.get('Cache-Tag'), 'route-rule, page, layout, sync-child');
		assert.match(await response.text(), /cache streaming/);
	});

	for (const tag of ['layout', 'sync-child']) {
		it(`runtime invalidation works for the late ${tag} tag`, async () => {
			const url = `http://example.com/?case=${tag}`;
			const first = await runtime.render(new Request(url));
			assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');
			assert.match(await first.text(), /cache streaming/);
			assert.equal((await runtime.render(new Request(url))).headers.get('X-Astro-Cache'), 'HIT');
			await runtime.render(
				new Request(`http://example.com/invalidate?tag=${tag}`, { method: 'POST' }),
			);
			assert.equal((await runtime.render(new Request(url))).headers.get('X-Astro-Cache'), 'MISS');
		});
	}

	it('never stores output when a component opts out after awaiting', async () => {
		for (let i = 0; i < 2; i++) {
			const response = await runtime.render(new Request('http://example.com/private'));
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), /private output/);
		}
	});
});
