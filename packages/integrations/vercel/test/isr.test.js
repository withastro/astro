import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('ISR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr/',
		});
		await fixture.build();
	});

	it('generates expected prerender config', async () => {
		const vcConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.prerender-config.json')
		);
		expect(vcConfig).to.deep.include({
			expiration: 120,
			bypassToken: '1c9e601d-9943-4e7c-9575-005556d774a8',
			allowQuery: ['x_astro_path'],
			passQuery: true,
		});
	});

	it('generates expected routes', async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		// the first two are /_astro/*, and filesystem routes
		expect(deploymentConfig.routes.slice(2)).to.deep.equal([
			{
				src: '^/two$',
				dest: '_render',
			},
			{
				src: '^\\/_image$',
				dest: '_render',
			},
			{
				src: '^\\/one\\/?$',
				dest: '/_isr?x_astro_path=$0',
			},
			{
				src: '^\\/two\\/?$',
				dest: '/_isr?x_astro_path=$0',
			},
		]);
	});
});
