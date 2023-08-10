import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

describe('Vercel edge middleware', () => {
	it('with edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/middleware-with-edge-file/dist/middleware.mjs'
		);
		expect(contents.includes('title:')).to.be.true;
		chaiJestSnapshot.setTestName('Middleware with handler file');
		expect(contents).to.matchSnapshot(true);
	});

	it('with edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-without-edge-file/',
		});
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/middleware-without-edge-file/dist/middleware.mjs'
		);
		expect(contents.includes('title:')).to.be.false;
		chaiJestSnapshot.setTestName('Middleware without handler file');
		expect(contents).to.matchSnapshot(true);
	});
});
