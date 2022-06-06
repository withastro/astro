import { runBuildAndStartAppFromSubprocess } from './helpers.js';
import { assertEquals, assert, DOMParser } from './deps.js';

async function startApp(cb) {
	await runBuildAndStartAppFromSubprocess('./fixtures/dynimport/', cb);
}

Deno.test({
	name: 'Dynamic import',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/');
			assertEquals(resp.status, 200);
			const html = await resp.text();
			assert(html);
			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc.querySelector('#thing');
			assert(div, 'div exists');
		});
	},
});
