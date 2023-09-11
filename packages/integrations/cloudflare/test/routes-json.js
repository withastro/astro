import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import cloudflare from '../dist/index.js';

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

	describe('with strategy `"include"`', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/dynamicOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
				adapter: cloudflare({
					mode: 'directory',
					routes: { strategy: 'include' },
				}),
			});
			await fixture.build();
		});

		it('creates `include` entries even though the `"exclude"` strategy would have produced less entries.', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/', '/_image', '/another'],
				exclude: [],
			});
		});
	});

	describe('with strategy `"exclude"`', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/staticOnly';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
				adapter: cloudflare({
					mode: 'directory',
					routes: { strategy: 'exclude' },
				}),
			});
			await fixture.build();
		});

		it('creates `exclude` entries even though the `"include"` strategy would have produced less entries.', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/*'],
				exclude: ['/', '/index.html', '/a/redirect'],
			});
		});
	});

	describe('with additional `include` entries', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/mixed';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
				adapter: cloudflare({
					mode: 'directory',
					routes: {
						strategy: 'include',
						include: ['/another', '/a/redundant'],
					},
				}),
			});
			await fixture.build();
		});

		it('creates `include` for functions and `exclude` for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/a/*', '/_image', '/another'],
				exclude: ['/a/', '/a/redirect', '/a/index.html'],
			});
		});
	});

	describe('with additional `exclude` entries', () => {
		let fixture;

		before(async () => {
			process.env.SRC = './src/mixed';
			fixture = await loadFixture({
				root: './fixtures/routesJson/',
				adapter: cloudflare({
					mode: 'directory',
					routes: {
						strategy: 'include',
						exclude: ['/another', '/a/*', '/a/index.html'],
					},
				}),
			});
			await fixture.build();
		});

		it('creates `include` for functions and `exclude` for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			expect(routes).to.deep.equal({
				version: 1,
				include: ['/a/*', '/_image'],
				exclude: ['/a/', '/a/*', '/another'],
			});
		});
	});
});
