import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Static build: pages routes have distURL', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {RouteData[]} */
	let checkRoutes;
	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro pages/',
			integrations: [
				{
					name: '@astrojs/distURL',
					hooks: {
						'astro:build:done': ({ routes }) => {
							checkRoutes = routes.filter((p) => p.type === 'page');
						},
					},
				},
			],
		});
		await fixture.build();
	});
	it('Pages routes have distURL', async () => {
		expect(checkRoutes).to.have.lengthOf.above(
			0,
			'Pages not found: build end hook not being called'
		);
		checkRoutes.forEach((p) =>
			expect(p)
				.to.have.property('distURL')
				.that.is.a('URL', `${p.pathname} doesn't include distURL`)
		);
	});
});
