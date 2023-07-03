/* Deno types consider DOM elements nullable */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts';
import { runBuildAndStartApp, defaultTestPermissions } from './helpers.ts';

// this needs to be here and not in the specific test case, because
// the variables are loaded in the global scope of the built server
// module, which is only executed once upon the first load
const varContent = 'this is a value stored in env variable';
Deno.env.set('SOME_VARIABLE', varContent);

Deno.test({
	name: 'Basics',
	permissions: defaultTestPermissions,
	sanitizeResources: false,
	sanitizeOps: false,
	async fn(t) {
		const app = await runBuildAndStartApp('./fixtures/basics/');

		await t.step('Works', async () => {
			const resp = await fetch(app.url);
			assertEquals(resp.status, 200);

			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc!.querySelector('#react');

			assert(div, 'div exists');
		});

		await t.step('Custom 404', async () => {
			const resp = await fetch(new URL('this-does-not-exist', app.url));
			assertEquals(resp.status, 404);

			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const header = doc!.querySelector('#custom-404');
			assert(header, 'displays custom 404');
		});

		await t.step('Loads style assets', async () => {
			let resp = await fetch(app.url);
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const link = doc!.querySelector('link');
			const href = link!.getAttribute('href');

			resp = await fetch(new URL(href!, app.url));
			assertEquals(resp.status, 200);
			const ct = resp.headers.get('content-type');
			assertEquals(ct, 'text/css; charset=UTF-8');
			await resp.body!.cancel();
		});

		await t.step('Correctly loads run-time env variables', async () => {
			const resp = await fetch(app.url);
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const p = doc!.querySelector('p#env-value');
			assertEquals(p!.innerText, varContent);
		});

		await t.step('Works with Markdown', async () => {
			const resp = await fetch(new URL('markdown', app.url));
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'Heading from Markdown');
		});

		await t.step('Works with MDX', async () => {
			const resp = await fetch(new URL('mdx', app.url));
			const html = await resp.text();

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'Heading from MDX');
		});

		await t.step('Astro.cookies', async () => {
			const url = new URL('/admin', app.url);
			const resp = await fetch(url, { redirect: 'manual' });
			assertEquals(resp.status, 302);

			const headers = resp.headers;
			assertEquals(headers.get('set-cookie'), 'logged-in=false; Max-Age=77760000; Path=/');
		});

		await t.step('perendering', async () => {
			const resp = await fetch(new URL('/prerender', app.url));
			assertEquals(resp.status, 200);

			const html = await resp.text();
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const h1 = doc!.querySelector('h1');
			assertEquals(h1!.innerText, 'test');
		});

		await t.step('node compatibility', async () => {
			const resp = await fetch(new URL('/nodecompat', app.url));
			assertEquals(resp.status, 200);
			await resp.text();
		});

		app.stop();
	},
});
