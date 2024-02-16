import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLoader } from '../../../dist/core/module-loader/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createController, handleRequest } from '../../../dist/vite-plugin-astro-server/index.js';
import { DevPipeline } from '../../../dist/vite-plugin-astro-server/pipeline.js';
import { createDevelopmentManifest } from '../../../dist/vite-plugin-astro-server/plugin.js';
import {
	createAstroModule,
	createBasicSettings,
	createFs,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

async function createDevPipeline(overrides = {}) {
	const settings = overrides.settings ?? (await createBasicSettings({ root: '/' }));
	const loader = overrides.loader ?? createLoader();
	const manifest = createDevelopmentManifest(settings);

	return DevPipeline.create({
		fsMod: overrides.fsMod,
		loader,
		logger: defaultLogger,
		manifest,
		settings,
	});
}

describe('vite-plugin-astro-server', () => {
	describe('request', () => {
		it('renders a request', async () => {
			const fs = createFs(
				{
					// Note that the content doesn't matter here because we are using a custom loader.
					'/src/pages/index.astro': '',
				},
				'/'
			);
			const pipeline = await createDevPipeline({
				fsMod: fs,
				loader: createLoader({
					import(id) {
						if (id === '\0astro-internal:middleware') {
							return { onRequest: (_, next) => next() };
						}
						const Page = createComponent(() => {
							return render`<div id="test">testing</div>`;
						});
						return createAstroModule(Page);
					},
				}),
			});
			const controller = createController({ loader: pipeline.loader });
			const { req, res, text } = createRequestAndResponse();

			try {
				await handleRequest({
					pipeline,
					controller,
					incomingRequest: req,
					incomingResponse: res,
				});
			} catch (err) {
				assert.equal(err.message, undefined);
			}

			const html = await text();
			assert.equal(res.statusCode, 200);
			assert.equal(html.includes('<div id="test">'), true);
		});
	});
});
