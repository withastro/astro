import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		expect(await fixture.readFile('../.vercel/output/static/index.html')).to.be.ok;
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('includeFiles work', async () => {
		expect(
			await fixture.readFile(
				'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/serverless-prerender/dist/middleware.mjs'
			)
		).to.be.ok;
	});
});

describe('Serverless hybrid rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-prerender/',
			output: 'hybrid',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		expect(await fixture.readFile('../.vercel/output/static/index.html')).to.be.ok;
	});
});
