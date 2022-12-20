import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse } from '../test-utils.js';
import svelte from '../../../../integrations/svelte/dist/index.js';
import { defaultLogging } from '../../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('core/render components', () => {
	it('should sanitize dynamic tags', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				const TagA = 'p style=color:red;'
				const TagB = 'p><script id="pwnd">console.log("pwnd")</script>'
				---
				<html>
					<head><title>testing</title></head>
					<body>
						<TagA id="target" />
						<TagB />
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
				logging: {
					...defaultLogging,
					// Error is expected in this test
					level: 'silent',
				},
				userConfig: {
					integrations: [svelte()],
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
				const target = $('#target');

				expect(target).not.to.be.undefined;
				expect(target.attr('id')).to.equal('target');
				expect(target.attr('style')).to.be.undefined;

				expect($('#pwnd').length).to.equal(0);
			}
		);
	});

	it('should unwrap function slots', async () => {
		const fs = createFs(
			{
				'/src/components/Test.ts': `
					import { createComponent } from 'astro/server/index.js';
					export default createComponent((result, props, slots) => {
						return typeof slots['default'];
					})
				`,
				'/src/pages/index.astro': `
					---
					import Test from '../components/Test.ts';
					---
					<html>
						<head><title>testing</title></head>
						<body>
							<span id="target">
								<Test>
									{() => 'foobar'}
								</Test>
							</span>
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
				logging: {
					...defaultLogging,
					// Error is expected in this test
					level: 'silent',
				},
				userConfig: {
					integrations: [],
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
				console.log(typeof html);
				const $ = cheerio.load(html);
				const target = $('#target');
				
				expect(target.length).to.equal(1);
				expect(target.text().trim()).to.equal('function');
			}
		);
	});
});
