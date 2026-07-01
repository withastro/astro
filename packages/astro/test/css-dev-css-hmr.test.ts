import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';
import { handleHotUpdate } from '../dist/vite-plugin-astro/hmr.js';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

describe('CSS - dev CSS HMR', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(
		async () => {
			fixture = await loadFixture({
				root: './fixtures/css-dev-css-hmr/',
			});

			devServer = await fixture.startDevServer();
		},
		{ timeout: 30000 },
	);

	after(async () => {
		await devServer.stop();
	});

	async function getInlineStyles(pathname: string) {
		const response = await fixture.fetch(pathname);
		assert.equal(response.status, 200);

		const html = await response.text();
		const $ = cheerio.load(html);

		return $('style').text();
	}

	async function waitForInlineStyles(pathname: string, pattern: RegExp) {
		let styles = '';

		for (let i = 0; i < 20; i++) {
			styles = await getInlineStyles(pathname);

			if (pattern.test(styles)) {
				return styles;
			}

			await delay(50);
		}

		assert.match(styles, pattern);
		return styles;
	}

	it('updates server-rendered inline CSS after a style-only change', {
		timeout: 30000,
	}, async () => {
		const beforeStyles = await getInlineStyles('/posts/test');

		assert.match(beforeStyles, /rgb\(255,\s*0,\s*0\)/);
		assert.doesNotMatch(beforeStyles, /rgb\(0,\s*0,\s*255\)/);

		await fixture.editFile('src/styles/global.css', (contents) =>
			contents.replace('rgb(255, 0, 0)', 'rgb(0, 0, 255)'),
		);

		const afterStyles = await waitForInlineStyles('/posts/test', /rgb\(0,\s*0,\s*255\)/);

		assert.doesNotMatch(afterStyles, /rgb\(255,\s*0,\s*0\)/);
	});
});

describe('CSS - dev HMR full reload bug', () => {
	// This test reproduces a bug where a nested CSS dependency change would delete the compile metadata
	// for the parent .astro file, forcing Vite to do a full page reload instead of a CSS hot update.
	it('should not delete compile metadata for parent .astro file when a nested CSS dependency changes', async () => {
		const cssFilePath = fileURLToPath(new URL('./fixtures/css-dev-hmr-css-dep/src/styles/components/hero.css', import.meta.url));
		const astroFilePath = fileURLToPath(new URL('./fixtures/css-dev-hmr-css-dep/src/layouts/Layout.astro', import.meta.url));

		const astroFileToCompileMetadata = new Map([
			[astroFilePath, {
				originalCode: '---\nimport "../styles/global.css";\n---\n<html></html>',
				css: [{ code: '.hero-title { color: royalblue; }', isGlobal: false, dependencies: [cssFilePath] }],
				scripts: [],
			}],
		]);

		const ctx = {
			file: cssFilePath,
			read: async () => '.hero-title { color: crimson; }',
			modules: [],
			server: {} as any,
			timestamp: Date.now(),
			type: 'update' as const,
		};

		await handleHotUpdate(ctx as any, {
			logger: { debug: () => {} } as any,
			compile: async () => ({}) as any,
			astroFileToCompileMetadata,
		});

		// The compile metadata for the parent .astro file should still exist, allowing the CSS virtual module to be properly reloaded without a full page refresh.
		assert.ok(astroFileToCompileMetadata.has(astroFilePath));
	});
});
