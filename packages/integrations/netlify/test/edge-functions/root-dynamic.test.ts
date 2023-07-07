import { loadFixture } from './test-utils.ts';
import { assertEquals } from './deps.ts';

Deno.test({
	// TODO: debug why build cannot be found in "await import"
	ignore: true,
	name: 'Assets are preferred over HTML routes',
	async fn() {
		const fixture = loadFixture('./fixtures/root-dynamic/');
		await fixture.runBuild();

		const { default: handler } = await import(
			'./fixtures/root-dynamic/.netlify/edge-functions/entry.js'
		);
		const response = await handler(new Request('http://example.com/styles.css'));
		assertEquals(response, undefined, 'No response because this is an asset');
		await fixture.cleanup();
	},
});
