// @ts-ignore
import { runBuild } from './test-utils.ts';
// @ts-ignore
import { assertEquals } from './deps.ts';

// @ts-ignore
Deno.test({
	name: 'Prerender',
	async fn() {
		let close = await runBuild('./fixtures/prerender/');
		const { default: handler } = await import(
			'./fixtures/prerender/.netlify/edge-functions/entry.mjs'
		);
		const response = await handler(new Request('http://example.com/index.html'));
		assertEquals(response, undefined, 'No response because this is an asset');
		await close();
	},
});