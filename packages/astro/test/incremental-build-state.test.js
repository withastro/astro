import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Incremental build state', () => {
	/** @type {import('./test-utils.ts').Fixture} */
	let fixture;
	let stateFile;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-build/',
			outDir: './dist/incremental-build-state/',
			cacheDir: './node_modules/.astro-incremental-build-state/',
			build: { inlineStylesheets: 'never' },
		});
		stateFile = new URL('./incremental-build-state.json', fixture.config.cacheDir);
	});

	after(async () => {
		await fs.rm(fixture.config.outDir, { recursive: true, force: true });
		await fs.rm(fixture.config.cacheDir, { recursive: true, force: true });
	});

	it('writes incremental build state for static builds', async () => {
		await fixture.build();

		const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
		assert.equal(state.version, 2);
		assert.equal(state.fingerprint.buildOutput, 'static');
		assert.equal(state.artifacts.outDir, fixture.config.outDir.toString());
		assert.equal(state.artifacts.cacheDir, fixture.config.cacheDir.toString());
		assert.equal(typeof state.summary.pageCount, 'number');
		assert.equal(typeof state.inputDigests, 'object');
		assert.equal(Array.isArray(state.pages), true);
		assert.equal(state.pages.length > 0, true);
		assert.equal(state.publicDirDigest === null || typeof state.publicDirDigest === 'string', true);

		const indexPage = state.pages.find((page) => page.component === 'src/pages/index.astro');
		assert.ok(indexPage);
		assert.equal(indexPage.moduleSpecifier, '/src/pages/index.astro');
		assert.equal(Array.isArray(indexPage.assets.styles), true);
		assert.equal(Array.isArray(indexPage.assets.scripts), true);
		assert.deepEqual(indexPage.generatedPaths, [
			{
				pathname: '/',
				output: new URL('./index.html', fixture.config.outDir).toString(),
			},
		]);
		assert.equal(indexPage.dependencies.modules.includes('/src/components/MainHead.astro'), true);
		assert.equal(indexPage.dependencies.modules.includes('/src/components/Nav/index.jsx'), true);

		const dynamicDataPage = state.pages.find(
			(page) => page.component === 'src/pages/data/[slug].json.ts',
		);
		assert.ok(dynamicDataPage);
		assert.deepEqual(
			dynamicDataPage.generatedPaths.map((entry) => entry.pathname),
			['/data/thing1.json', '/data/thing2.json'],
		);

		const scriptsPage = state.pages.find((page) => page.component === 'src/pages/scripts.astro');
		assert.ok(scriptsPage);
		assert.equal(
			scriptsPage.dependencies.modules.includes('/src/components/InlineScripts.astro'),
			true,
		);
		assert.equal(
			scriptsPage.dependencies.modules.includes('/src/components/ExternalScripts.astro'),
			true,
		);
	});

	it('recreates incremental build state on force rebuilds', async () => {
		await fs.mkdir(new URL('./', stateFile), { recursive: true });
		await fs.writeFile(stateFile, '{ invalid json', 'utf-8');

		await fixture.build({ force: true });

		const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
		assert.equal(state.version, 2);
		assert.equal(state.fingerprint.buildOutput, 'static');
	});
});
