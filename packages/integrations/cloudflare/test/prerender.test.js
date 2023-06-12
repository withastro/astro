import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import slash from 'slash';

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

	it('includes prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(await fixture.readFile('/_routes.json')).exclude.map((r) =>
			slash(r)
		);
		const expectedExcludedRoutes = ['/_worker.js', '/one/index.html', '/one/'];

		expect(foundRoutes.every((element) => expectedExcludedRoutes.includes(element))).to.be.true;
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

	it('includes prerendered routes in the routes.json config', async () => {
		const foundRoutes = JSON.parse(await fixture.readFile('/_routes.json')).exclude.map((r) =>
			slash(r)
		);
		const expectedExcludedRoutes = ['/_worker.js', '/index.html', '/'];

		expect(foundRoutes.every((element) => expectedExcludedRoutes.includes(element))).to.be.true;
	});
});
