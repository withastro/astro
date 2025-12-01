import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Collections with external outDir', () => {
	/** @type {import("./test-utils.js").Fixture} */
	let fixture;
	let tempOutDir;

	before(async () => {
		// Create a temporary directory outside the project for outDir
		tempOutDir = join(tmpdir(), 'astro-test-outdir-' + Date.now());
		
		fixture = await loadFixture({
			root: './fixtures/content-layer/',
			outDir: tempOutDir,
		});
	});

	after(async () => {
		// Clean up temp directory
		try {
			const fs = await import('node:fs/promises');
			await fs.rm(tempOutDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore cleanup errors
		}
	});

	describe('Build with external outDir', () => {
		before(async () => {
			await fixture.build({ force: true });
		});

		it('copies content-assets.mjs to external outDir', async () => {
			const contentAssetsPath = join(tempOutDir, '.astro', 'content-assets.mjs');
			assert.ok(existsSync(contentAssetsPath), 'content-assets.mjs should exist in external outDir');
		});

		it('copies content-modules.mjs to external outDir', async () => {
			const contentModulesPath = join(tempOutDir, '.astro', 'content-modules.mjs');
			assert.ok(existsSync(contentModulesPath), 'content-modules.mjs should exist in external outDir');
		});

		it('copies data-store.json to external outDir if it exists', async () => {
			const dataStorePath = join(tempOutDir, '.astro', 'data-store.json');
			// This file may or may not exist depending on the content configuration
			// If it exists in the project, it should be copied
			const projectDataStorePath = join(fixture.config.root.pathname, '.astro', 'data-store.json');
			if (existsSync(projectDataStorePath)) {
				assert.ok(existsSync(dataStorePath), 'data-store.json should be copied if it exists');
			}
		});

		it('copies collections manifest to external outDir if it exists', async () => {
			const collectionsManifestPath = join(tempOutDir, '.astro', 'collections', 'collections.json');
			// This file may or may not exist depending on the content configuration
			const projectCollectionsPath = join(fixture.config.root.pathname, '.astro', 'collections', 'collections.json');
			if (existsSync(projectCollectionsPath)) {
				assert.ok(existsSync(collectionsManifestPath), 'collections.json should be copied if it exists');
			}
		});

		it('builds successfully and pages work', async () => {
			// Verify that the build was successful by checking for the main page
			const indexPath = join(tempOutDir, 'index.html');
			assert.ok(existsSync(indexPath), 'index.html should exist in external outDir');
		});
	});
});