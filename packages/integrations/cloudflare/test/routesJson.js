import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

/** @type {import('./test-utils.js').Fixture} */
describe('_routes.json generation', () => {
	after(() => {
		delete process.env.SRC;
	});

	describe('of both functions and static files', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/mixed';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('creates `include` for functions and `exclude` for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/a/*', '/_image'],
				exclude: ['/a/', '/a/redirect', '/a/index.html'],
			});
		});
	});

	describe('of only functions', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/dynamicOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('creates a wildcard `include` and `exclude` only for the redirect', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/*'],
				exclude: ['/a/redirect'],
			});
		});
	});

	describe('of only static files', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/staticOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('create only one `include` and `exclude` that are supposed to match nothing', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/_image'],
				exclude: [],
			});
		});
	});
});
