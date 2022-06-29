// @ts-ignore
import { runBuild } from './test-utils.ts';
// @ts-ignore
import { assertEquals, assert, DOMParser } from './deps.ts';

// @ts-ignore
Deno.test({
	// TODO: debug why build cannot be found in "await import"
	ignore: true,
	name: 'Edge Basics',
	skip: true,
	async fn() {
		let close = await runBuild('./fixtures/edge-basic/');
		const { default: handler } = await import(
			'./fixtures/edge-basic/.netlify/edge-functions/entry.js'
		);
		const response = await handler(new Request('http://example.com/'));
		assertEquals(response.status, 200);
		const html = await response.text();
		assert(html, 'got some html');

		const doc = new DOMParser().parseFromString(html, `text/html`)!;
		const div = doc.querySelector('#react');
		assert(div, 'div exists');

		await close();
	},
});
