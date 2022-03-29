import { runBuildAndStartApp } from './helpers.js';
import { assertEquals, assert } from './deps.js';

Deno.test({
	name: 'Basics',
	async fn() {
		await runBuildAndStartApp('./fixtures/basics/', async () => {
			const resp = await fetch('http://127.0.0.1:8085/');
			assertEquals(resp.status, 200);
			const html = await resp.text();
			assert(html);
		});
	}
});
