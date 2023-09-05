import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Serverless with dynamic routes', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-with-dynamic-routes/',
			output: 'hybrid',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		expect(await fixture.readFile('../.vercel/output/static/index.html')).to.be.ok;
		expect(await fixture.readFile('../.vercel/output/functions/[id]/index.astro.func/.vc-config.json')).to.be.ok;
		expect(await fixture.readFile('../.vercel/output/functions/api/[id].js.func/.vc-config.json')).to.be.ok;
	});
});
