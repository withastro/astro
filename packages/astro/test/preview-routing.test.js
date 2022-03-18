import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Preview Routing', () => {
	describe('pageUrlFormat: directory', () => {
		describe('Subpath without trailing slash and trailingSlash: never', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4000/', import.meta.url),
					buildOptions: {
						pageUrlFormat: 'directory',
					},
					devOptions: {
						trailingSlash: 'never',
						port: 4000,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
				expect(response.redirected).to.equal(false);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('404 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2');
				expect(response.status).to.equal(404);
			});
		});

		describe('Subpath without trailing slash and trailingSlash: always', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4001/', import.meta.url),
					buildOptions: {},
					devOptions: {
						trailingSlash: 'always',
						port: 4001,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('200 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading another page with subpath not used', async () => {
				const response = await fixture.fetch('/blog/another');
				expect(response.status).to.equal(404);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2/');
				expect(response.status).to.equal(404);
			});
		});

		describe('Subpath without trailing slash and trailingSlash: ignore', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4002/', import.meta.url),
					buildOptions: {},
					devOptions: {
						trailingSlash: 'ignore',
						port: 4002,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('200 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(200);
			});

			it('200 when loading another page with subpath not used', async () => {
				const response = await fixture.fetch('/blog/another');
				expect(response.status).to.equal(200);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2/');
				expect(response.status).to.equal(404);
			});
		});
	});

	describe('pageUrlFormat: file', () => {
		describe('Subpath without trailing slash and trailingSlash: never', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4003/', import.meta.url),
					buildOptions: {
						pageUrlFormat: 'file',
					},
					devOptions: {
						trailingSlash: 'never',
						port: 4003,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
				expect(response.redirected).to.equal(false);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('404 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2');
				expect(response.status).to.equal(404);
			});
		});

		describe('Subpath without trailing slash and trailingSlash: always', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4004/', import.meta.url),
					buildOptions: {
						pageUrlFormat: 'file',
					},
					devOptions: {
						trailingSlash: 'always',
						port: 4004,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('200 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading another page with subpath not used', async () => {
				const response = await fixture.fetch('/blog/another');
				expect(response.status).to.equal(404);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2/');
				expect(response.status).to.equal(404);
			});
		});

		describe('Subpath without trailing slash and trailingSlash: ignore', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4005/', import.meta.url),
					buildOptions: {
						pageUrlFormat: 'file',
					},
					devOptions: {
						trailingSlash: 'ignore',
						port: 4005,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath root with trailing slash', async () => {
				const response = await fixture.fetch('/blog/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading subpath root without trailing slash', async () => {
				const response = await fixture.fetch('/blog');
				expect(response.status).to.equal(404);
			});

			it('200 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another/');
				expect(response.status).to.equal(200);
			});

			it('200 when loading another page with subpath not used', async () => {
				const response = await fixture.fetch('/blog/another');
				expect(response.status).to.equal(200);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1/');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2/');
				expect(response.status).to.equal(404);
			});
		});

		describe('Exact file path', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;
			/** @type {import('./test-utils').PreviewServer} */
			let previewServer;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/with-subpath-no-trailing-slash/',
					dist: new URL('./fixtures/with-subpath-no-trailing-slash/dist-4006/', import.meta.url),
					buildOptions: {
						pageUrlFormat: 'file',
					},
					devOptions: {
						trailingSlash: 'ignore',
						port: 4006,
					},
				});
				await fixture.build();
				previewServer = await fixture.preview();
			});

			after(async () => {
				await previewServer.stop();
			});

			it('404 when loading /', async () => {
				const response = await fixture.fetch('/');
				expect(response.status).to.equal(404);
			});

			it('200 when loading subpath with index.html', async () => {
				const response = await fixture.fetch('/blog/index.html');
				expect(response.status).to.equal(200);
			});

			it('200 when loading another page with subpath used', async () => {
				const response = await fixture.fetch('/blog/another.html');
				expect(response.status).to.equal(200);
			});

			it('200 when loading dynamic route', async () => {
				const response = await fixture.fetch('/blog/1.html');
				expect(response.status).to.equal(200);
			});

			it('404 when loading invalid dynamic route', async () => {
				const response = await fixture.fetch('/blog/2.html');
				expect(response.status).to.equal(404);
			});
		});
	});
});
