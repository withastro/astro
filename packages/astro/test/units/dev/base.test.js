import { expect } from 'chai';

import { DevApp } from '../../../dist/core/app/dev.js';
import { createFs } from '../test-utils.js';

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

				try {
					const request = new Request(`http://localhost:8080/docs/`);
					const response = await app.render(request);
	
					expect(response.status).to.equal(404);
				} finally {
					await app.close();
				}
			});

			it('Requests that exclude a trailing slash 200', async () => {
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

				const app = new DevApp({
					fs,
					root,
					userConfig: {
						base: '/docs',
						trailingSlash: 'never',
					},
				});

				try {
					const request = new Request(`http://localhost:8080/docs/sub/`);

					const response = await app.render(request);
					expect(response.status).to.equal(404);
				} finally {
					await app.close();
				}
			});

			it('Requests that exclude a trailing slash 200', async () => {
				const fs = createFs(
					{
						'/src/pages/sub/index.astro': `<h1>testing</h1>`,
					},
					root
				);

				const app = new DevApp({
					fs,
					root,
					userConfig: {
						base: '/docs',
						trailingSlash: 'never',
					},
				});

				try {
					const request = new Request(`http://localhost:8080/docs/sub`);

					const response = await app.render(request);
					expect(response.status).to.equal(200);
				} finally {
					await app.close();
				}
			});
		});
	});
});
