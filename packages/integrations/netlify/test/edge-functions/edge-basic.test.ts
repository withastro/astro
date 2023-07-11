import { loadFixture } from './test-utils.ts';
import { assertEquals, assert, DOMParser } from './deps.ts';

Deno.env.set('SECRET_STUFF', 'secret');

Deno.test({
	ignore: true,
	name: 'Edge Basics',
	permissions: 'inherit',
	async fn(t) {
		const fixture = loadFixture('./fixtures/edge-basic/');
		await t.step('Run the build', async () => {
			await fixture.runBuild();
		});
		await t.step('Should correctly render the response', async () => {
			// TODO: debug why build cannot be found in "await import"
			// Seems that the files are created, but can't be read at this stage.
			// Remove the cleanup at the end and run twice, and the test will pass.
			// This is weird...
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
		});

		await t.step('Clean up', async () => {
			await fixture.cleanup();
		});
	},
});
