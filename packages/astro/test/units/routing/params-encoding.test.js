// @ts-check
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { renderPath } from '../../../dist/core/build/generate.js';
import { createMockPrerenderer, createStaticBuildOptions } from '../build/test-helpers.js';
import { createRouteData } from '../mocks.js';

describe('Astro.params — encoded characters in static paths', () => {
	let options;

	before(async () => {
		options = await createStaticBuildOptions();
	});

	for (const param of ['[page]', '%23something', '%2Fsomething', '%3Fsomething']) {
		it(`preserves ${param} in outFile path and HTML body`, async () => {
			const pathname = `/${param}`;
			const prerenderer = createMockPrerenderer({
				[pathname]: `<html><body><h2 class="category">${param}</h2></body></html>`,
			});
			const route = createRouteData({ route: '/[category]', pathname, type: 'page' });

			const result = await renderPath({
				prerenderer,
				pathname,
				route,
				options,
				logger: options.logger,
			});

			assert.ok(result !== null);
			assert.ok(
				result.outFile.pathname.includes(encodeURIComponent(param)),
				`expected outFile path to contain encoded form of ${param}`,
			);
			assert.ok(result.body.toString().includes(param));
		});
	}
});
