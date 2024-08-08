import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { copyFiles } from '../dist/core/build/static-build.js';
import { loadFixture } from './test-utils.js';

describe('Experimental Content Collections cache - invalidation', () => {
	class CacheBackup {
		constructor(root, relCacheDir) {
			this.root = new URL(root, import.meta.url);
			this.cacheDir = new URL(relCacheDir, this.root);
			this.tmpDir = new URL(`./tmp` + relCacheDir.slice(1), this.root);
		}

		backup() {
			this.rmTmp();
			copyFiles(this.cacheDir, this.tmpDir);
		}

		restore() {
			fs.rmSync(this.cacheDir, { recursive: true });
			copyFiles(this.tmpDir, this.cacheDir);
		}

		rmTmp() {
			fs.rmSync(this.tmpDir, { force: true, recursive: true });
		}
	}

	class ManifestTestPlugin {
		used = false;

		plugin() {
			return {
				name: '@test/manifest-used',
				hooks: {
					'astro:build:done': ({ cacheManifest }) => {
						this.used = cacheManifest;
					},
				},
			};
		}
	}

	describe('manifest version', () => {
		let fixture,
			backup,
			/** @type {ManifestTestPlugin} */
			testPlugin;
		before(async () => {
			testPlugin = new ManifestTestPlugin();
			fixture = await loadFixture({
				root: './fixtures/content-collections-cache-invalidation/',
				cacheDir: './cache/version-mismatch/',
				experimental: { contentCollectionCache: true },
				integrations: [testPlugin.plugin()],
			});
			backup = new CacheBackup(
				'./fixtures/content-collections-cache-invalidation/',
				'./cache/version-mismatch/',
			);
			backup.backup();
			await fixture.build();
		});

		after(async () => {
			backup.restore();
			//await fixture.clean();
		});

		it('Manifest was not used', () => {
			assert.equal(testPlugin.used, false, 'manifest not used because of version mismatch');
		});
	});

	describe('lockfiles', () => {
		let fixture,
			backup,
			/** @type {ManifestTestPlugin} */
			testPlugin;
		before(async () => {
			testPlugin = new ManifestTestPlugin();
			fixture = await loadFixture({
				root: './fixtures/content-collections-cache-invalidation/',
				cacheDir: './cache/lockfile-mismatch/',
				experimental: { contentCollectionCache: true },
				integrations: [testPlugin.plugin()],
			});
			backup = new CacheBackup(
				'./fixtures/content-collections-cache-invalidation/',
				'./cache/lockfile-mismatch/',
			);
			backup.backup();
			await fixture.build();
		});

		after(async () => {
			backup.restore();
			//await fixture.clean();
		});

		it('Manifest was not used', () => {
			assert.equal(testPlugin.used, false, 'manifest not used because of lockfile mismatch');
		});
	});

	describe('duplicate content', () => {
		let fixture,
			backup,
			/** @type {ManifestTestPlugin} */
			testPlugin;
		before(async () => {
			testPlugin = new ManifestTestPlugin();
			fixture = await loadFixture({
				root: './fixtures/content-collections-same-contents/',
				cacheDir: './cache/same-contents/',
				experimental: { contentCollectionCache: true },
				integrations: [testPlugin.plugin()],
			});
			backup = new CacheBackup(
				'./fixtures/content-collections-same-contents/',
				'./cache/same-contents/',
			);
			backup.backup();
			await fixture.build();
		});

		after(async () => {
			backup.restore();
			//await fixture.clean();
		});

		it('Manifest was not used', () => {
			assert.equal(testPlugin.used, false, 'manifest not used because of lockfile mismatch');
		});
	});
});
