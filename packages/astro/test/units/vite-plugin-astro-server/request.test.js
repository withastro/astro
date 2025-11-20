import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';
import {
	createBasicSettings,
	createFixture,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

async function createDevPipeline(overrides = {}, root) {
	const settings = overrides.settings ?? (await createBasicSettings({ root }));
	const loader = overrides.loader ?? createLoader();
	const manifest = createDevelopmentManifest(settings);
	const routesList = await createRoutesList(
		{
			cwd: root,
			settings: settings,
		},
		defaultLogger,
	);
	return DevPipeline.create(routesList, {
		loader,
		logger: defaultLogger,
		manifest,
		settings,
		getDebugInfo: async () => '',
	});
}

describe('vite-plugin-astro-server', () => {
	describe('url', () => {
		let container;
		let settings;

		before(async () => {
			const fileSystem = {
				'/src/pages/url.astro': `{Astro.request.url}`,
				'/src/pages/prerendered.astro': `---
			export const prerender = true;
			---
			{Astro.request.url}`,
			};
			const fixture = await createFixture(fileSystem);
			settings = await createBasicSettings({
				root: fixture.path,
				output: 'server',
				adapter: testAdapter(),
			});
			container = await createContainer({
				settings,
				logger: defaultLogger,
			});
		});

		after(async () => {
			await container.close();
		});

		it('params are included', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/url?xyz=123',
			});
			container.handle(req, res);
			assert.equal(res.statusCode, 200);

			const html = await text();
			assert.deepEqual(html, '<!DOCTYPE html>http://localhost/url?xyz=123');
		});

		it('params are excluded on prerendered routes', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/prerendered?xyz=123',
			});
			container.handle(req, res);
			const html = await text();
			assert.equal(res.statusCode, 200);

			assert.deepEqual(html, '<!DOCTYPE html>http://localhost/prerendered');
		});
	});
});
