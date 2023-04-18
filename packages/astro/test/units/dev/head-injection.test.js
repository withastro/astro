import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('head injection', () => {
	it('Dynamic injection from component created in the page frontmatter', async () => {
		const fs = createFs(
			{
				'/src/components/Other.astro': `
					<style>
						div {
							background: grey;
						}
					</style>
					<div id="other">Other</div>
				`,
				'/src/common/head.js': `
					// astro-head-inject
					import Other from '../components/Other.astro';
					import {
						createComponent,
						createHeadAndContent,
						renderComponent,
						renderTemplate,
						renderUniqueStylesheet,
						unescapeHTML
					} from 'astro/runtime/server/index.js';

					export function renderEntry() {
						return createComponent({
							factory(result, props, slots) {
								return createHeadAndContent(
									unescapeHTML(renderUniqueStylesheet(result, {
										href: '/some/fake/styles.css'
									})),
									renderTemplate\`$\{renderComponent(result, 'Other', Other, props, slots)}\`
								);
							},
							propagation: 'self'
						});
					}
				`.trim(),
				'/src/pages/index.astro': `
					---
					import { renderEntry } from '../common/head.js';
					const Head = renderEntry();
					---
					<html>
						<head><title>Testing</title></head>
						<body>
							<h1>testing</h1>
							<Head />
						</body>
					</html>
				`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				root,
				userConfig: {
					vite: { server: { middlewareMode: true } },
				},
			},
			async (container) => {
				const { req, res, done, text } = createRequestAndResponse({
					method: 'GET',
					url: '/',
				});
				container.handle(req, res);
				await done;
				const html = await text();
				const $ = cheerio.load(html);

				expect($('link[rel=stylesheet][href="/some/fake/styles.css"]')).to.have.a.lengthOf(1);
				expect($('#other')).to.have.a.lengthOf(1);
			}
		);
	});

	it('Dynamic injection from a layout component', async () => {
		const fs = createFs(
			{
				'/src/components/Other.astro': `
					<style>
						div {
							background: grey;
						}
					</style>
					<div id="other">Other</div>
				`,
				'/src/common/head.js': `
					// astro-head-inject
					import Other from '../components/Other.astro';
					import {
						createComponent,
						createHeadAndContent,
						renderComponent,
						renderTemplate,
						renderUniqueStylesheet,
						unescapeHTML,
					} from 'astro/runtime/server/index.js';

					export function renderEntry() {
						return createComponent({
							factory(result, props, slots) {
								return createHeadAndContent(
									unescapeHTML(renderUniqueStylesheet(result, {
										href: '/some/fake/styles.css'
									})),
									renderTemplate\`$\{renderComponent(result, 'Other', Other, props, slots)}\`
								);
							},
							propagation: 'self'
						});
					}
				`.trim(),
				'/src/components/Layout.astro': `
					---
					import { renderEntry } from '../common/head.js';
					const ExtraHead = renderEntry();
					---
					<html>
						<head>
							<title>Normal head stuff</title>
						</head>
						<body>
							<slot name="title" />
							<ExtraHead />
						</body>
					</html>
				`,
				'/src/pages/index.astro': `
					---
					import Layout from '../components/Layout.astro';
					---
					<Layout>
						<h1 slot="title">Test page</h1>
					</Layout>
				`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				root,
				userConfig: {
					vite: { server: { middlewareMode: true } },
				},
			},
			async (container) => {
				const { req, res, done, text } = createRequestAndResponse({
					method: 'GET',
					url: '/',
				});
				container.handle(req, res);
				await done;
				const html = await text();
				const $ = cheerio.load(html);

				expect($('link[rel=stylesheet][href="/some/fake/styles.css"]')).to.have.a.lengthOf(1);
				expect($('#other')).to.have.a.lengthOf(1);
			}
		);
	});
});
