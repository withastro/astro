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
				const Tag = 'p style=color:red;'
				---
				<html>
					<head><title>testing</title></head>
					<body>
						<Tag id="target" />
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
			}
		);
	});
});
