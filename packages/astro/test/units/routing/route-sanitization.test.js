import {
	createBasicSettings,
	createFs,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';
import { createRouteManifest } from '../../../dist/core/routing/index.js';
import { fileURLToPath } from 'node:url';
import { createViteLoader } from '../../../dist/core/module-loader/vite.js';
import { expect } from 'chai';
import { createContainer } from '../../../dist/core/dev/container.js';
import * as cheerio from 'cheerio';
import testAdapter from '../../test-adapter.js';
import { getSortedPreloadedMatches } from '../../../dist/prerender/routing.js';
import { createDevelopmentManifest } from '../../../dist/vite-plugin-astro-server/plugin.js';
import DevPipeline from '../../../dist/vite-plugin-astro-server/devPipeline.js';

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
	let pipeline;
	let manifestData;
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

		const loader = createViteLoader(container.viteServer);
		const manifest = createDevelopmentManifest(container.settings);
		pipeline = new DevPipeline({ manifest, logger: defaultLogger, settings, loader });
		manifestData = createRouteManifest(
			{
				cwd: fileURLToPath(root),
				settings,
				fsMod: fs,
			},
			defaultLogger
		);
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
