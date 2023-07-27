import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

/** @type {import('./test-utils.js').Fixture} */
describe('generate _routes.json"', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/routes/',
		});
		await fixture.build();
	});

	it('creates includes for functions and excludes for static files where needed', async () => {
		const _routesJson = await fixture.readFile('/_routes.json');
		const routes = JSON.parse(_routesJson);

		expect(routes).to.deep.equal({
			version: 1,
			include: ['/a/endpoint', '/a/*'],
			exclude: ['/a/prerendered1/index.html', '/a/prerendered1/'],
		});
	});
});
