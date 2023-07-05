import { loadFixture } from './test-utils.js';
import { expect, use } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

use(chaiJestSnapshot);

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	beforeEach(function () {
		chaiJestSnapshot.configureUsingMochaContext(this);
	});

	before(async () => {
		chaiJestSnapshot.resetSnapshotRegistry();
		fixture = await loadFixture({
			root: './fixtures/middleware/',
		});
	});

	it('build successfully the middleware edge file', async () => {
		await fixture.build();
		const contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/packages/integrations/vercel/test/fixtures/middleware/dist/middleware.mjs'
		);
		expect(contents).to.matchSnapshot();
	});
});
