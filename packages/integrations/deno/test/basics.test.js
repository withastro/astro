import { runBuildAndStartApp } from './helpers.js';
import { assertEquals, assert, DOMParser } from './deps.js';

async function startApp(cb) {
	await runBuildAndStartApp('./fixtures/basics/', cb);
}

// this needs to be here and not in the specific test case, because
// the variables are loaded in the global scope of the built server
// module, which is only executed once upon the first load
const varContent = 'this is a value stored in env variable';
Deno.env.set('SOME_VARIABLE', varContent);

Deno.test({
	name: 'Basics',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/');
			assertEquals(resp.status, 200);
			const html = await resp.text();
			assert(html);
			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc.querySelector('#react');
			assert(div, 'div exists');
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

Deno.test({
	name: 'Correctly loads run-time env variables',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/');
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const p = doc.querySelector('p#env-value');
			assertEquals(p.innerText, varContent);
		});
	},
});

Deno.test({
	name: 'Works with Markdown',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/markdown');
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc.querySelector('h1');
			assertEquals(h1.innerText, 'Heading from Markdown');
		});
	},
});

Deno.test({
	name: 'Works with MDX',
	async fn() {
		await startApp(async () => {
			const resp = await fetch('http://127.0.0.1:8085/mdx');
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc.querySelector('h1');
			assertEquals(h1.innerText, 'Heading from MDX');
		});
	},
});
