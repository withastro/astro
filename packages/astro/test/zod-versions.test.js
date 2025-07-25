import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Zod versions', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').App} */
	let app;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/zod-versions/',
			output: 'server',
			outDir: './dist/normal',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it("uses the site's Zod version in SSR page", async () => {
		const request = new Request('http://example.com/not-prerendered.json');
		const response = await app.render(request);
		const json = await response.json();
		// This uses the topJSONSchema function that's only available in Zod v4+
		assert.equal(json['$schema'], 'https://json-schema.org/draft/2020-12/schema');
	});

	it("uses the site's Zod version in prerendered page", async () => {
		const data = await fixture.readFile('client/prerendered.json');
		const json = JSON.parse(data);
		assert.equal(json['$schema'], 'https://json-schema.org/draft/2020-12/schema');
	});

	it("can access Astro's Zod version via Astro's virtual modules", async () => {
		const request = new Request('http://example.com/astro-zod.json');
		const response = await app.render(request);
		const json = await response.json();
		assert.equal(json.astroContentZodIsZod4, false);
		assert.equal(json.astroZodIsZod4, false);
		assert.equal(json.zodIsZod4, true);
		assert.equal(json.astroZodAndZodContentAreSame, true);
	});
});
