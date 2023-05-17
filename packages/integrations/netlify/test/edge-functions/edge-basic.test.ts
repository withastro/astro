import { loadFixture } from './test-utils.ts';
import { assertEquals, assert, DOMParser } from './deps.ts';

Deno.env.set('SECRET_STUFF', 'secret');

// @ts-expect-error
Deno.test({
	// TODO: debug why build cannot be found in "await import"
	ignore: true,
	name: 'Edge Basics',
	skip: true,
	async fn() {
		const fixture = loadFixture('./fixtures/edge-basic/');
		await fixture.runBuild();
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

		await fixture.cleanup();
	},
});
