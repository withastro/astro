import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { defaultClientConditions, resolveConfig } from 'vite';
import { getViteConfig } from '../dist/config/index.js';
import { loadFixture } from './test-utils.js';

describe('Vite Config', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/config-vite/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Allows overriding bundle naming options in the build', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.match($('link').attr('href'), /\/assets\/testing-(.)+\.css/);
	});
});

describe('getViteConfig', () => {
	let originalCwd;
	before(() => {
		originalCwd = process.cwd();
		// We chdir because otherwise it sets the wrong root in the site config
		process.chdir(fileURLToPath(new URL('./fixtures/config-vite/', import.meta.url)));
	});
	it('Does not change the default config.', async () => {
		const command = 'serve';
		const mode = 'test';
		const configFn = getViteConfig({}, { logLevel: 'silent' });
		const config = await configFn({ command, mode });
		const resolvedConfig = await resolveConfig(config, command, mode);
		assert.deepStrictEqual(resolvedConfig.resolve.conditions, [
			...defaultClientConditions,
			'astro',
		]);
	});
	after(() => {
		process.chdir(originalCwd);
	});
});
