import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { serializeRouteData } from '../../../dist/core/app/index.js';
import { createContainer } from '../../../dist/core/dev/container.js';
import { createLoader } from '../../../dist/core/module-loader/index.js';
import { createRoutesList } from '../../../dist/core/routing/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { AstroServerApp } from '../../../dist/vite-plugin-app/app.js';
import { createController } from '../../../dist/vite-plugin-astro-server/index.js';
import { createDevelopmentManifest } from '../../../dist/vite-plugin-astro-server/plugin.js';
import testAdapter from '../../test-adapter.js';
import {
	createAstroModule,
	createBasicSettings,
	createFixture,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

async function createDevApp(overrides = {}, root) {
	const settings = overrides.settings ?? (await createBasicSettings({ root }));
	const loader = overrides.loader ?? createLoader({});
	const manifest = await createDevelopmentManifest(settings);
	const routesList = await createRoutesList(
		{
			cwd: root,
			settings: settings,
		},
		defaultLogger,
	);

	if (!manifest.routes) {
		manifest.routes = [];
	}
	for (const route of routesList.routes) {
		manifest.routes.push({
			file: '',
			links: [],
			scripts: [],
			styles: [],
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
	}

	// TODO: temporarily inject route list inside manifest

	return new AstroServerApp(manifest, true, defaultLogger, routesList, loader, settings);
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
