import { StartServerCallback, runBuildAndStartApp, defaultTestPermissions } from './helpers.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts';

async function startApp(cb: StartServerCallback) {
	await runBuildAndStartApp('./fixtures/basics/', cb);
}

// this needs to be here and not in the specific test case, because
// the variables are loaded in the global scope of the built server
// module, which is only executed once upon the first load
const varContent = 'this is a value stored in env variable';
Deno.env.set('SOME_VARIABLE', varContent);

Deno.test({
	name: 'Basics',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(baseUrl);
			assertEquals(resp.status, 200);

			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc!.querySelector('#react');

			assert(div, 'div exists');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Custom 404',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(new URL('this-does-not-exist', baseUrl));
			assertEquals(resp.status, 404);

			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const header = doc!.querySelector('#custom-404');
			assert(header, 'displays custom 404');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Loads style assets',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			let resp = await fetch(baseUrl);
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const link = doc!.querySelector('link');
			const href = link!.getAttribute('href');

			resp = await fetch(new URL(href!, baseUrl));
			assertEquals(resp.status, 200);
			const ct = resp.headers.get('content-type');
			assertEquals(ct, 'text/css');
			await resp.body!.cancel();
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Correctly loads run-time env variables',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(baseUrl);
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const p = doc!.querySelector('p#env-value');
			assertEquals(p!.innerText, varContent);
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Works with Markdown',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(new URL('markdown', baseUrl));
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'Heading from Markdown');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Works with MDX',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(new URL('mdx', baseUrl));
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'Heading from MDX');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'Astro.cookies',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const url = new URL('/admin', baseUrl);
			const resp = await fetch(url, { redirect: 'manual' });
			assertEquals(resp.status, 302);

			const headers = resp.headers;
			assertEquals(headers.get('set-cookie'), 'logged-in=false; Max-Age=77760000; Path=/');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

Deno.test({
	name: 'perendering',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(new URL('perendering', baseUrl));
			assertEquals(resp.status, 200);


			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'test');
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});
