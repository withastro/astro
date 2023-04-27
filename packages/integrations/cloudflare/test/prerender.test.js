import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Prerendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender/', import.meta.url),
		});
		await fixture.build();
	});

	it('includes prerendered routes in the routes.json config', async () => {
		const routes = JSON.parse(await fixture.readFile('/_routes.json'));
		expect(routes.exclude).to.include('/one/');
	});
});
