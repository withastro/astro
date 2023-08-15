import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Prerendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/prerender/',
		});
		await fixture.build();
	});

	after(() => {
		delete process.env.PRERENDER;
		fixture.clean();
	});

	it('includes non prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(await fixture.readFile('/_routes.json'));

		expect(foundRoutes).to.deep.equal({
			version: 1,
			include: ['/'],
			exclude: [],
		});
	});
});

describe('Hybrid rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/prerender/',
			output: 'hybrid',
		});
		await fixture.build();
	});

	after(() => {
		delete process.env.PRERENDER;
	});

	it('includes non prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(await fixture.readFile('/_routes.json'));

		expect(foundRoutes).to.deep.equal({
			version: 1,
			include: ['/one'],
			exclude: [],
		});
	});
});
