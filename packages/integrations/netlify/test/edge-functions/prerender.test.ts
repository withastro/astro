import { loadFixture } from './test-utils.ts';
import { assertEquals, assertExists, cheerio, fs } from './deps.ts';

Deno.test({
	name: 'Prerender',
	async fn(t) {
		const environmentVariables = {
			PRERENDER: 'true',
		};
		const fixture = loadFixture('./fixtures/prerender/', environmentVariables);
		await fixture.runBuild();

		await t.step('Handler can process requests to non-existing routes', async () => {
			const { default: handler } = await import(
				'./fixtures/prerender/.netlify/edge-functions/entry.js'
			);
			assertExists(handler);
			const response = await handler(new Request('http://example.com/index.html'));
			assertEquals(response, undefined, "No response because this route doesn't exist");
		});

		await t.step('Prerendered route exists', async () => {
			let content: string | null = null;
			try {
				const path = new URL('./fixtures/prerender/dist/index.html', import.meta.url);
				content = Deno.readTextFileSync(path);
			} catch (e) {}
			assertExists(content);
			const $ = cheerio.load(content);
			assertEquals($('h1').text(), 'testing');
		});

		Deno.env.delete('PRERENDER');
		await fixture.cleanup();
	},
});

Deno.test({
	name: 'Hybrid rendering',
	async fn(t) {
		const environmentVariables = {
			PRERENDER: 'false',
		};
		const fixture = loadFixture('./fixtures/prerender/', environmentVariables);
		await fixture.runBuild();

		const stop = await fixture.runApp('./fixtures/prerender/prod.js');
		await t.step('Can fetch server route', async () => {
			const response = await fetch('http://127.0.0.1:8085/');
			assertEquals(response.status, 200);

			const html = await response.text();
			const $ = cheerio.load(html);
			assertEquals($('h1').text(), 'testing');
		});
		stop();

		await t.step('Handler can process requests to non-existing routes', async () => {
			const { default: handler } = await import(
				'./fixtures/prerender/.netlify/edge-functions/entry.js'
			);
			const response = await handler(new Request('http://example.com/index.html'));
			assertEquals(response, undefined, "No response because this route doesn't exist");
		});

		await t.step('Has no prerendered route', async () => {
			let prerenderedRouteExists = false;
			try {
				const path = new URL('./fixtures/prerender/dist/index.html', import.meta.url);
				prerenderedRouteExists = fs.existsSync(path);
			} catch (e) {}
			assertEquals(prerenderedRouteExists, false);
		});
		await fixture.cleanup();
	},
});
