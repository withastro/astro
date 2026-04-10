import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Incremental build state', () => {
	/** @type {import('./test-utils.ts').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-build/',
			outDir: './dist/incremental-build-state/',
			cacheDir: './node_modules/.astro-incremental-build-state/',
			build: { inlineStylesheets: 'never' },
		});
	});

	after(async () => {
		await fs.rm(fixture.config.outDir, { recursive: true, force: true });
		await fs.rm(fixture.config.cacheDir, { recursive: true, force: true });
	});

	async function getOnlyStateFile() {
		const stateFiles = (await fs.readdir(fixture.config.cacheDir)).filter((fileName) =>
			/^incremental-build-state\.[a-f0-9]+\.json$/.test(fileName),
		);
		assert.equal(stateFiles.length, 1);
		return new URL(`./${stateFiles[0]}`, fixture.config.cacheDir);
	}

	it('writes incremental build state for static builds', async () => {
		await fixture.build();

		const stateFile = await getOnlyStateFile();
		const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
		assert.equal(state.version, 4);
		assert.equal(state.fingerprint.buildOutput, 'static');
		assert.equal(typeof state.fingerprint.viteConfigDigest, 'string');
		assert.equal(typeof state.fingerprint.integrationHooksDigest, 'string');
		assert.equal(typeof state.fingerprint.projectMetadataDigest, 'string');
		assert.equal(typeof state.fingerprint.buildImplementationDigest, 'string');
		assert.equal(state.artifacts.outDir, fixture.config.outDir.toString());
		assert.equal(state.artifacts.cacheDir, fixture.config.cacheDir.toString());
		assert.equal(typeof state.summary.pageCount, 'number');
		assert.equal(typeof state.dependencyDigests, 'object');
		assert.equal(typeof state.dataDigests, 'object');
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
		assert.equal(
			indexPage.dependencies.modules.includes('file:/src/components/MainHead.astro'),
			true,
		);
		assert.equal(
			indexPage.dependencies.modules.includes('file:/src/components/Nav/index.jsx'),
			true,
		);

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
			scriptsPage.dependencies.modules.includes('file:/src/components/InlineScripts.astro'),
			true,
		);
		assert.equal(
			scriptsPage.dependencies.modules.includes('file:/src/components/ExternalScripts.astro'),
			true,
		);
	});

	it('recreates incremental build state on force rebuilds', async () => {
		await fixture.build();

		const stateFile = await getOnlyStateFile();
		await fs.mkdir(new URL('./', stateFile), { recursive: true });
		await fs.writeFile(stateFile, '{ invalid json', 'utf-8');

		await fixture.build({ force: true });

		const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
		assert.equal(state.version, 4);
		assert.equal(state.fingerprint.buildOutput, 'static');
	});
});
