import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('maxDuration', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
		});
		await fixture.build();
	});

	it('falls back to 404.html', async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		// change the index if necesseary
		expect(deploymentConfig.routes[2]).to.deep.include({
			src: '/.*',
			dest: '/404.html',
			status: 404,
		});
	});
});
