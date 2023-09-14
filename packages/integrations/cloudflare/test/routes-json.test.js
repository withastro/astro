import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils.js').Fixture} */
describe('_routes.json generation', () => {
	for (const mode of ['directory', 'advanced']) {
		for (const functionPerRoute of [false, true]) {
			describe(`with mode=${mode}, functionPerRoute=${functionPerRoute}`, () => {
				describe('of both functions and static files', () => {
					let fixture;

					before(async () => {
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/mixed',
							adapter: cloudflare({
								mode,
								functionPerRoute,
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
							exclude: ['/a/', '/a/redirect', '/a/index.html'],
						});
					});
				});

				describe('of only functions', () => {
					let fixture;

					before(async () => {
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/dynamicOnly',
							adapter: cloudflare({
								mode,
								functionPerRoute,
							}),
						});
						await fixture.build();
					});

					it('creates a wildcard `include` and `exclude` only for static assets and redirects', async () => {
						const _routesJson = await fixture.readFile('/_routes.json');
						const routes = JSON.parse(_routesJson);

						expect(routes).to.deep.equal({
							version: 1,
							include: ['/*'],
							exclude: ['/public.txt', '/redirectme', '/a/redirect'],
						});
					});
				});

				describe('of only static files', () => {
					let fixture;

					before(async () => {
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/staticOnly',
							adapter: cloudflare({
								mode,
								functionPerRoute,
							}),
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
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/dynamicOnly',
							adapter: cloudflare({
								mode,
								functionPerRoute,
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
							include: ['/', '/_image', '/dynamic1', '/dynamic2', '/dynamic3'],
							exclude: [],
						});
					});
				});

				describe('with strategy `"exclude"`', () => {
					let fixture;

					before(async () => {
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/staticOnly',
							adapter: cloudflare({
								mode,
								functionPerRoute,
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
							exclude: ['/', '/index.html', '/public.txt', '/redirectme', '/a/redirect'],
						});
					});
				});

				describe('with additional `include` entries', () => {
					let fixture;

					before(async () => {
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/mixed',
							adapter: cloudflare({
								mode,
								functionPerRoute,
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
						fixture = await loadFixture({
							root: './fixtures/routes-json/',
							srcDir: './src/mixed',
							adapter: cloudflare({
								mode,
								functionPerRoute,
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
		}
	}
});
