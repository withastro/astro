import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse, triggerFSEvent } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('dev container', () => {
	it('can render requests', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				const name = 'Testing';
				---
				<html>
					<head><title>{name}</title></head>
					<body>
						<h1>{name}</h1>
					</body>
				</html>
			`,
			},
			root
		);

		await runInContainer({ fs, root }, async (container) => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect(res.statusCode).to.equal(200);
			expect($('h1')).to.have.a.lengthOf(1);
		});
	});

	it('HMR only short circuits on previously cached modules', async () => {
		const fs = createFs(
			{
				'/src/components/Header.astro': `
					<h1>{Astro.props.title}</h1>
				`,
				'/src/pages/index.astro': `
					---
					import Header from '../components/Header.astro';
					const name = 'Testing';
					---
					<html>
						<head><title>{name}</title></head>
						<body class="one">
							<Header title={name} />
						</body>
					</html>
				`,
			},
			root
		);

		await runInContainer({ fs, root }, async (container) => {
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(r.req, r.res);
			let html = await r.text();
			let $ = cheerio.load(html);
			expect($('body.one')).to.have.a.lengthOf(1);

			fs.writeFileFromRootSync(
				'/src/components/Header.astro',
				`
				<h1>{Astro.props.title}</h1>
			`
			);
			triggerFSEvent(container, fs, '/src/components/Header.astro', 'change');

			fs.writeFileFromRootSync(
				'/src/pages/index.astro',
				`
				---
				import Header from '../components/Header.astro';
				const name = 'Testing';
				---
				<html>
					<head><title>{name}</title></head>
					<body class="two">
						<Header title={name} />
					</body>
				</html>
			`
			);
			triggerFSEvent(container, fs, '/src/pages/index.astro', 'change');

			r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(r.req, r.res);
			html = await r.text();
			$ = cheerio.load(html);
			expect($('body.one')).to.have.a.lengthOf(0);
			expect($('body.two')).to.have.a.lengthOf(1);
		});
	});

	it('Allows dynamic segments in injected routes', async () => {
		const fs = createFs(
			{
				'/src/components/test.astro': `<h1>{Astro.params.slug}</h1>`,
				'/src/pages/test-[slug].astro': `<h1>{Astro.params.slug}</h1>`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				root,
				userConfig: {
					output: 'server',
					integrations: [
						{
							name: '@astrojs/test-integration',
							hooks: {
								'astro:config:setup': ({ injectRoute }) => {
									injectRoute({
										pattern: '/another-[slug]',
										entryPoint: './src/components/test.astro',
									});
								},
							},
						},
					],
				},
			},
			async (container) => {
				let r = createRequestAndResponse({
					method: 'GET',
					url: '/test-one',
				});
				container.handle(r.req, r.res);
				await r.done;
				expect(r.res.statusCode).to.equal(200);

				// Try with the injected route
				r = createRequestAndResponse({
					method: 'GET',
					url: '/another-two',
				});
				container.handle(r.req, r.res);
				await r.done;
				expect(r.res.statusCode).to.equal(200);
			}
		);
	});

	it('Serves injected 404 route for any 404', async () => {
		const fs = createFs(
			{
				'/src/components/404.astro': `<h1>Custom 404</h1>`,
				'/src/pages/page.astro': `<h1>Regular page</h1>`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				root,
				userConfig: {
					output: 'server',
					integrations: [
						{
							name: '@astrojs/test-integration',
							hooks: {
								'astro:config:setup': ({ injectRoute }) => {
									injectRoute({
										pattern: '/404',
										entryPoint: './src/components/404.astro',
									});
								},
							},
						},
					],
				},
			},
			async (container) => {
				{
					// Regular pages are served as expected.
					const r = createRequestAndResponse({ method: 'GET', url: '/page' });
					container.handle(r.req, r.res);
					await r.done;
					const doc = await r.text();
					expect(doc).to.match(/<h1>Regular page<\/h1>/);
					expect(r.res.statusCode).to.equal(200);
				}
				{
					// `/404` serves the custom 404 page as expected.
					const r = createRequestAndResponse({ method: 'GET', url: '/404' });
					container.handle(r.req, r.res);
					await r.done;
					const doc = await r.text();
					expect(doc).to.match(/<h1>Custom 404<\/h1>/);
					expect(r.res.statusCode).to.equal(404);
				}
				{
					// A non-existent page also serves the custom 404 page.
					const r = createRequestAndResponse({ method: 'GET', url: '/other-page' });
					container.handle(r.req, r.res);
					await r.done;
					const doc = await r.text();
					expect(doc).to.match(/<h1>Custom 404<\/h1>/);
					expect(r.res.statusCode).to.equal(404);
				}
			}
		);
	});

	it('items in public/ are not available from root when using a base', async () => {
		await runInContainer(
			{
				root,
				userConfig: {
					base: '/sub/',
				},
			},
			async (container) => {
				// First try the subpath
				let r = createRequestAndResponse({
					method: 'GET',
					url: '/sub/test.txt',
				});

				container.handle(r.req, r.res);
				await r.done;

				expect(r.res.statusCode).to.equal(200);

				// Next try the root path
				r = createRequestAndResponse({
					method: 'GET',
					url: '/test.txt',
				});

				container.handle(r.req, r.res);
				await r.done;

				expect(r.res.statusCode).to.equal(301);
				expect(r.res.getHeader('location')).to.equal('/sub/test.txt');
			}
		);
	});

	it('items in public/ are available from root when not using a base', async () => {
		await runInContainer({ root }, async (container) => {
			// Try the root path
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/test.txt',
			});

			container.handle(r.req, r.res);
			await r.done;

			expect(r.res.statusCode).to.equal(200);
		});
	});
});
