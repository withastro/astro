// @ts-expect-error
import { runBuild } from './test-utils.ts';
// @ts-expect-error
import { assertEquals, assert, DOMParser } from './deps.ts';

// @ts-expect-error
Deno.env.set('SECRET_STUFF', 'secret');

// @ts-expect-error
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

		const envDiv = doc.querySelector('#env');
		assertEquals(envDiv?.innerText, 'secret');

		await close();
	},
});
