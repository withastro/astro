import { StartServerCallback, runBuildAndStartApp, defaultTestPermissions } from './helpers.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts';

async function startApp(cb: StartServerCallback) {
	await runBuildAndStartApp('./fixtures/image/', cb);
}

Deno.test({
	name: 'Image basics',
	permissions: defaultTestPermissions,
	async fn() {
		await startApp(async (baseUrl: URL) => {
			const resp = await fetch(baseUrl);
			assertEquals(resp.status, 200);

			const html = await resp.text();
			console.log(html);
			/*
			assert(html);

			const doc = new DOMParser().parseFromString(html, `text/html`);
			const div = doc!.querySelector('#react');

			assert(div, 'div exists');
			*/
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});
