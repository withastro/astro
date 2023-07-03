import { runBuild, runApp } from './test-utils.ts';
import { assertEquals, assert, DOMParser } from './deps.ts';

Deno.test({
	name: 'Dynamic imports',
	async fn() {
		await runBuild('./fixtures/dynimport/');
		const stop = await runApp('./fixtures/dynimport/prod.js');

		try {
			const response = await fetch('http://127.0.0.1:8085/');
			assertEquals(response.status, 200);
			const html = await response.text();

			assert(html, 'got some html');
			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc.querySelector('#thing');
			assert(div, 'div exists');
		} catch (err) {
			console.error(err);
		} finally {
			await stop();
		}
	},
});
