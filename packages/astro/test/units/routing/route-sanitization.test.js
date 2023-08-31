import {
	createBasicSettings,
	createFs,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { createContainer } from '../../../dist/core/dev/container.js';
import * as cheerio from 'cheerio';
import testAdapter from '../../test-adapter.js';

const root = new URL('../../fixtures/alias/', import.meta.url);
const fileSystem = {
'/src/pages/[...testSlashTrim].astro': `
	---
	export function getStaticPaths() {
		return [
			{
				params: {
					testSlashTrim: "/a-route-param-with-leading-trailing-slash/",
				},
			},
		];
	}
	---
	<p>Success!</p>
`,
};

describe('Route sanitization', () => {
	let container;
	let settings;

	before(async () => {
		const fs = createFs(fileSystem, root);
		settings = await createBasicSettings({
			root: fileURLToPath(root),
			trailingSlash: 'never',
			output: 'hybrid',
			adapter: testAdapter(),
		});
		container = await createContainer({
			fs,
			settings,
			logger: defaultLogger,
		});
	});

	after(async () => {
		await container.close();
	});

	describe('Request', () => {
		it('should correctly match a route param with a trailing slash', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/a-route-param-with-leading-trailing-slash',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Success!');
		});
	});
});
