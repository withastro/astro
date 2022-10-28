import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('dev container', () => {
	it('can render requests', async () => {
		
		const fs = createFs({
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
			`
		}, root);

		await runInContainer({ fs, root }, async container => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/'
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect(res.statusCode).to.equal(200);
			expect($('h1')).to.have.a.lengthOf(1);
		});
	});
});
