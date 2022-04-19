// @ts-ignore
import { runBuild } from './test-utils.ts';
// @ts-ignore
import { assertEquals, assert } from './deps.ts';

// @ts-ignore
Deno.test({
	name: 'Edge Basics',
	async fn() {
		let close = await runBuild('./fixtures/edge-basic/');
		const { default: handler } = await import('./fixtures/edge-basic/dist/edge-functions/entry.mjs');
		const response = await handler(new Request('http://example.com/'));
		assertEquals(response.status, 200);
		const html = await response.text();
		assert(html, 'got some html');
		await close();
	},
});
