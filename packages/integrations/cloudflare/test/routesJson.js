import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

/** @type {import('./test-utils.js').Fixture} */
describe('generate _routes.json', () => {
	after(() => {
		delete process.env.SRC;
	});

	describe('both functions and static files', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/mixed';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('creates includes for functions and excludes for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/a/*'],
				exclude: ['/a/', '/a/redirect', '/a/index.html'],
			});
		});
	});

	describe('only functions', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/dynamicOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('creates a wildcard include and excludes only for the redirect', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/*'],
				exclude: ['/a/redirect'],
			});
		});
	});

	describe('only static files', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/staticOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
			});
			await fixture.build();
		});

		it('create only one include that is supposed to match nothing', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/MATCH_NONE_INCLUDE_PATTERN'],
				exclude: [],
			});
		});
	});
});
