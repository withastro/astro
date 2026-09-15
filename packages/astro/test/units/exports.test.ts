import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { it } from 'node:test';
import { glob } from 'tinyglobby';

it('"exports" and "publishConfig.exports" should be the same except for internal API', async () => {
	const { default: pkgJson } = await import('../../package.json', { with: { type: 'json' } });
	const exports: Record<string, unknown> = { ...pkgJson.exports };
	const publishConfigExports: Record<string, unknown> = pkgJson.publishConfig.exports;
	const internal = Object.keys(exports).filter((key) => key.startsWith('./_internal/'));
	for (const key of internal) {
		delete exports[key];
	}
	assert.deepEqual(exports, publishConfigExports);
});

it('publishable source should not reference workspace-only exports', async () => {
	const { default: pkgJson } = await import('../../package.json', { with: { type: 'json' } });
	const workspaceOnlyExports = Object.keys(pkgJson.exports).filter(
		(key) => !(key in pkgJson.publishConfig.exports),
	);
	const packageRoot = new URL('../../', import.meta.url);
	const files = await glob(
		[
			'bin/**/*.{js,mjs}',
			'components/**/*.{astro,js,mjs,ts}',
			'src/**/*.{js,mjs,ts}',
			'templates/**/*.{astro,js,mjs,ts}',
		],
		{ cwd: fileURLToPath(packageRoot) },
	);

	for (const file of files) {
		const source = await readFile(new URL(file, packageRoot), 'utf-8');
		for (const entrypoint of workspaceOnlyExports) {
			const specifier = `astro${entrypoint.slice(1)}`;
			assert.equal(
				source.includes(specifier),
				false,
				`${file} references workspace-only export ${specifier}`,
			);
		}
	}
});
