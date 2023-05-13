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

	it('includes prerendered routes in the routes.json config', async () => {
		const routes = JSON.parse(await fixture.readFile('/_routes.json'));
		expect(routes.exclude).to.deep.equal(['/_worker.js', '/one/index.html', '/one/']);
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
			experimental: {
				hybridOutput: true,
			},
		});
		await fixture.build();
	});

	after(() => {
		delete process.env.PRERENDER;
	});

	it('includes prerendered routes in the routes.json config', async () => {
		const routes = JSON.parse(await fixture.readFile('/_routes.json'));
		expect(routes.exclude).to.deep.equal(['/_worker.js', '/index.html', '/']);

	});
});
