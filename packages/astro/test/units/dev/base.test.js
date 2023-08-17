import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { createFs, createRequestAndResponse, runInContainer } from '../test-utils.js';

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

				await runInContainer(
					{
						fs,
						inlineConfig: {
							root: fileURLToPath(root),
							base: '/docs',
							trailingSlash: 'never',
						},
					},
					async (container) => {
						const { req, res, done } = createRequestAndResponse({
							method: 'GET',
							url: '/docs/',
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
						'/src/pages/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				await runInContainer(
					{
						fs,
						inlineConfig: {
							root: fileURLToPath(root),
							base: '/docs',
							trailingSlash: 'never',
						},
					},
					async (container) => {
						const { req, res, done } = createRequestAndResponse({
							method: 'GET',
							url: '/docs',
						});
						container.handle(req, res);
						await done;
						expect(res.statusCode).to.equal(200);
					}
				);
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
						inlineConfig: {
							root: fileURLToPath(root),
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
						inlineConfig: {
							root: fileURLToPath(root),
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
