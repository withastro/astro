import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import * as cheerio from 'cheerio';
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
