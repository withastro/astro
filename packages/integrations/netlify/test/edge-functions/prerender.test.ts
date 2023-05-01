import { runBuild } from './test-utils.ts';
import { assertEquals } from './deps.ts';

Deno.test({
	name: 'Prerender',
	async fn() {
		let close = await runBuild('./fixtures/prerender/');
		const { default: handler } = await import(
			'./fixtures/prerender/.netlify/edge-functions/entry.js'
		);
		const response = await handler(new Request('http://example.com/index.html'));
		assertEquals(response, undefined, 'No response because this is an asset');
		await close();
	},
});
