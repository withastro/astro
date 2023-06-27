import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware/',
			build: {
				excludeMiddleware: true,
			},
		});
	});

	it('build successfully the middleware edge file', async () => {
		await fixture.build();
		expect(
			await fixture.readFile(
				// this is abysmal...
				'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/middleware/dist/middleware.mjs'
			)
		).to.be.ok;
	});
});
