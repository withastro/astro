import { expect } from 'chai';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { DevApp } from '../../../dist/core/app/dev.js';
import { createFs, createRequestAndResponse } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('base configuration', () => {
	describe('with trailingSlash: "never"', () => {
		describe('index route', () => {
			it('Requests that include a trailing slash 404', async () => {
				const fs = createFs(
					{
						'/src/pages/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				const app = new DevApp({
					root,
					fs,
					userConfig: {
						base: '/docs',
						trailingSlash: 'never',
					},
				});

				const request = new Request(`http://localhost:8080/docs/`);
				const response = await app.render(request);

				expect(response.status).to.equal(404);
			});

			it.only('Requests that exclude a trailing slash 200', async () => {
				const fs = createFs(
					{
						'/src/pages/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				const app = new DevApp({
					root,
					fs,
					userConfig: {
						base: '/docs',
						trailingSlash: 'never',
					},
				});

				try {
					const request = new Request(`http://localhost:8080/docs`);

					const response = await app.render(request);
					expect(response.status).to.equal(200);
				} finally {
					await app.close();
				}
			});
		});

		describe('sub route', () => {
			it('Requests that include a trailing slash 404', async () => {
				const fs = createFs(
					{
						'/src/pages/sub/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				await runInContainer(
					{
						fs,
						root,
						userConfig: {
							base: '/docs',
							trailingSlash: 'never',
						},
					},
					async (container) => {
						const { req, res, done } = createRequestAndResponse({
							method: 'GET',
							url: '/docs/sub/',
						});
						container.handle(req, res);
						await done;
						expect(res.statusCode).to.equal(404);
					}
				);
			});

			it('Requests that exclude a trailing slash 200', async () => {
				const fs = createFs(
					{
						'/src/pages/sub/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				await runInContainer(
					{
						fs,
						root,
						userConfig: {
							base: '/docs',
							trailingSlash: 'never',
						},
					},
					async (container) => {
						const { req, res, done } = createRequestAndResponse({
							method: 'GET',
							url: '/docs/sub',
						});
						container.handle(req, res);
						await done;
						expect(res.statusCode).to.equal(200);
					}
				);
			});
		});
	});
});
