import { expect } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';
import { loadFixture } from './test-utils.js';

describe('Vercel edge middleware', () => {
	// TODO: The path here seems to be inconsistent?
	it.skip('with edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/integrations/vercel/test/fixtures/middleware-with-edge-file/dist/middleware.mjs'
		);
		expect(contents.includes('title:')).to.be.true;
		chaiJestSnapshot.setTestName('Middleware with handler file');
		expect(contents).to.matchSnapshot(true);
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('without edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-without-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/integrations/vercel/test/fixtures/middleware-without-edge-file/dist/middleware.mjs'
		);
		expect(contents.includes('title:')).to.be.false;
		chaiJestSnapshot.setTestName('Middleware without handler file');
		expect(contents).to.matchSnapshot(true);
	});
});
