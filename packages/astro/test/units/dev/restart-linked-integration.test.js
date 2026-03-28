import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	createContainerWithAutomaticRestart,
} from '../../../dist/core/dev/index.js';
import { createFixture, createRequestAndResponse } from '../test-utils.js';

/** @type {import('astro').AstroInlineConfig} */
const defaultInlineConfig = {
	logLevel: 'silent',
};

describe('linked integration transforms across config restarts', { timeout: 20000 }, () => {
	it('keeps linked integration transforms working after an astro.config restart', async () => {
		const astroConfig = `
			import { defineConfig } from 'astro/config';
			import exampleIntegration from './packages/example-integration/integration.mjs';

			export default defineConfig({
				site: 'https://example.com',
				integrations: [exampleIntegration()],
			});
		`;

		const fixture = await createFixture({
			'/astro.config.mjs': astroConfig,
			'/packages/example-integration/integration.mjs': `
				export default function exampleIntegration() {
					const plugin = {
						name: '@test/self-mutating-transform',
						configResolved(config) {
							if (config.command === 'build') {
								delete plugin.transform;
							}
						},
						transform(code, id) {
							if (id.endsWith('.custom.js')) {
								return code.replace('__MESSAGE__', JSON.stringify('Transformed after restart'));
							}
						},
					};

					return {
						name: '@test/example-integration',
						hooks: {
							'astro:config:setup': ({ injectRoute, updateConfig }) => {
								injectRoute({
									pattern: '',
									entrypoint: new URL('./InjectedPage.astro', import.meta.url),
									prerender: true,
								});
								updateConfig({
									vite: {
										plugins: [plugin],
									},
								});
							},
						},
					};
				}
			`,
			'/packages/example-integration/InjectedPage.astro': `
				---
				import message from './message.custom.js';
				---

				<html>
					<body>
						<p>{message}</p>
					</body>
				</html>
			`,
			'/packages/example-integration/message.custom.js': `
				export default __MESSAGE__;
			`,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});

		try {
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			restart.container.handle(r.req, r.res);
			let html = await r.text();
			assert.equal(r.res.statusCode, 200);
			assert.match(html, /Transformed after restart/);

			const restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', astroConfig.replace('example.com', 'example.org'));
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);
			const hmrError = await restartComplete;
			assert.equal(hmrError, null);

			r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			restart.container.handle(r.req, r.res);
			html = await r.text();
			assert.equal(r.res.statusCode, 200);
			assert.match(html, /Transformed after restart/);
		} finally {
			await restart.container.close();
		}
	});
});
