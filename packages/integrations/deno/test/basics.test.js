import { runBuildAndStartApp } from './helpers.js';
import { assertEquals, assert, DOMParser } from './deps.js';

async function startApp(cb) {
	await runBuildAndStartApp('./fixtures/basics/', cb);
}

Deno.test({
	name: 'Basics',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/');
			assertEquals(resp.status, 200);
			const html = await resp.text();
			assert(html);
		});
	},
});

Deno.test({
	name: 'Loads style assets',
	async fn() {
		await startApp(async () => {
			let resp = await fetch('http://127.0.0.1:8085/');
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const link = doc.querySelector('link');
			const href = link.getAttribute('href');

			resp = await fetch(new URL(href, 'http://127.0.0.1:8085/'));
			assertEquals(resp.status, 200);
			const ct = resp.headers.get('content-type');
			assertEquals(ct, 'text/css');
			await resp.body.cancel();
		});
	},
});
