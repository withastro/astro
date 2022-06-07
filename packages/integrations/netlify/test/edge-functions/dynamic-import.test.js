// @ts-ignore
import { runBuild, runApp } from './test-utils.ts';
// @ts-ignore
import { assertEquals, assert, DOMParser } from './deps.ts';

// @ts-ignore
Deno.test({
	name: 'Dynamic imports',
	async fn() {
		let close = await runBuild('./fixtures/dynimport/');
		let stop = await runApp('./fixtures/dynimport/prod.js');

		try {
			const response = await fetch('http://127.0.0.1:8085/');
			assertEquals(response.status, 200);
			const html = await response.text();

			assert(html, 'got some html');
			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc.querySelector('#thing');
			assert(div, 'div exists');
		} finally {
			await close();
			await stop();
		}
	},
});
