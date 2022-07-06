// @ts-ignore
import { runBuild } from './test-utils.ts';
// @ts-ignore
import { assertEquals, assert, DOMParser } from './deps.ts';

// @ts-ignore
Deno.test({
	// TODO: debug why build cannot be found in "await import"
	ignore: true,
	name: 'Assets are preferred over HTML routes',
	async fn() {
		let close = await runBuild('./fixtures/root-dynamic/');
		const { default: handler } = await import(
			'./fixtures/root-dynamic/.netlify/edge-functions/entry.js'
		);
		const response = await handler(new Request('http://example.com/styles.css'));
		assertEquals(response, undefined, 'No response because this is an asset');
		await close();
	},
});
