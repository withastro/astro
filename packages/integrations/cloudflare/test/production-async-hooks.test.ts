import assert from 'node:assert/strict';
import fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import { getBuildOutputDirectory, type Fixture, loadFixture } from './test-utils.ts';

// Edge-safety scan: incremental metadata collection is scoped with
// AsyncLocalStorage, but the only `node:async_hooks` reference in the adapter
// lives in `utils/prerender-scope.ts`, loaded via a dynamic import behind the
// compile-time `isPrerender` const. Production worker bundles must therefore
// contain zero occurrences of the specifier — no static import, no dynamic
// import, no bare specifier string — even though the same build prerenders
// pages (with metadata collection) through the workerd prerender worker.
describe('production worker async_hooks scan', () => {
	const root = new URL('./fixtures/production-async-hooks/', import.meta.url);
	let fixture: Fixture;

	function walk(dir: string): string[] {
		return fs
			.readdirSync(dir, { recursive: true, encoding: 'utf-8' })
			.map((entry) => join(dir, entry))
			.filter((file) => fs.statSync(file).isFile());
	}

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({ root: './fixtures/production-async-hooks/' });
		await fixture.build();
	});

	it('prerenders through workerd with the incremental cache active', () => {
		// Sanity: the build exercised the prerender worker (where async_hooks IS
		// legitimately used, under the auto-appended nodejs_als flag) with the
		// incremental cache enabled.
		assert.ok(
			fs.existsSync(new URL('node_modules/.astro/incremental-build.json', root)),
			'the incremental manifest should be written',
		);
		assert.ok(
			fixture.pathExists('client/prerendered/index.html'),
			'the prerendered page should be emitted',
		);
	});

	it('emits a production worker with zero occurrences of async_hooks', () => {
		const serverDir = fileURLToPath(getBuildOutputDirectory(root, 'server'));
		const files = walk(serverDir).filter((file) => /\.(?:m?js|cjs)$/.test(file));
		assert.ok(files.length > 0, 'expected production worker JS output');
		for (const file of files) {
			const source = fs.readFileSync(file, 'utf-8');
			assert.ok(
				!source.includes('async_hooks'),
				`production worker file ${file} must not reference async_hooks`,
			);
		}
	});

	it('does not append nodejs_als to the deployed Cloudflare config', () => {
		// The auto-appended flag shapes only the transient build-time prerender
		// worker; the user's deployable config must be untouched.
		const configPath = new URL('.cloudflare/output/v0/workers/default/worker.config.json', root);
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		assert.ok(
			!(config.compatibilityFlags ?? []).includes('nodejs_als'),
			'deployed config must not gain the nodejs_als flag',
		);
	});
});
