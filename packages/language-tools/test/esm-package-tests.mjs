import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { it } from 'node:test';

export function registerPackageTests(context) {
	it('loads packed public APIs through import and require without a loader', () => {
		context.run(`
			import assert from 'node:assert/strict';
			import { createRequire } from 'node:module';
			const require = createRequire(import.meta.url);
			for (const [name, key] of [['@astrojs/language-server', 'AstroCheck'], ['@astrojs/check', 'check'], ['@astrojs/yaml2ts', 'yaml2ts']]) {
				const esm = await import(name);
				const cjs = require(name);
				assert.equal(typeof esm[key], 'function');
				assert.equal(esm[key], cjs[key]);
			}
			const esm = await import('@astrojs/ts-plugin');
			assert.equal(typeof require('@astrojs/ts-plugin'), 'function');
			assert.equal(esm.default, require('@astrojs/ts-plugin'));
			assert.equal(typeof require('@astrojs/language-server').Diagnostic.create, 'function');
		`);
	});

	it('ships a working version launcher and declaration assets', async () => {
		const server = path.dirname(context.require.resolve('@astrojs/language-server/package.json'));
		const manifest = JSON.parse(await fs.readFile(path.join(server, 'package.json'), 'utf8'));
		assert.equal(
			execFileSync(context.runtime, [path.join(server, 'bin/nodeServer.js'), '--version'], {
				env: context.env,
				encoding: 'utf8',
				timeout: 10000,
			}).trim(),
			manifest.version,
		);
		for (const file of [
			'astro-jsx.d.ts',
			'jsx-runtime-fallback.d.ts',
			'jsx-runtime-augment.d.ts',
		]) {
			await fs.access(path.join(server, 'types', file));
		}
	});
}
