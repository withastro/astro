import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts";
import { assert, assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { runBuildAndStartAppFromSubprocess } from "./helpers.ts";

async function startApp(cb: () => Promise<void>) {
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
			const div = doc!.querySelector('#thing');
			assert(div, 'div exists');
		});
	},
});
