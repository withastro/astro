import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { build, type Plugin } from 'vite';

const zodPatchModule = fileURLToPath(
	new URL('../../../dist/preview-release/zod.js', import.meta.url),
);

/** A bundle entry, served from memory so the test needs no fixture on disk. */
function entry(code: string): Plugin {
	const id = 'virtual:bundle-entry';
	return {
		name: 'virtual-bundle-entry',
		resolveId(source) {
			if (source === id) return id;
			if (source === 'astro-preview-zod') return zodPatchModule;
		},
		load(source) {
			if (source === id) return code;
		},
	};
}

/** Bundles `code` the way a Cloudflare Worker does, then reports the module ids it pulled in. */
async function bundleModules(code: string): Promise<Set<string>> {
	const modules = new Set<string>();
	await build({
		configFile: false,
		logLevel: 'silent',
		plugins: [
			entry(code),
			{
				name: 'capture-modules',
				generateBundle(_options, bundle) {
					for (const output of Object.values(bundle)) {
						if (output.type !== 'chunk') continue;
						for (const id of Object.keys(output.modules)) modules.add(id);
					}
				},
			},
		],
		build: {
			ssr: true,
			write: false,
			minify: false,
			rollupOptions: {
				input: 'virtual:bundle-entry',
				output: { entryFileNames: 'entry.mjs' },
			},
		},
		// Cloudflare disables externalization, so dependencies are bundled rather than left as imports.
		ssr: { noExternal: true },
	});
	return modules;
}

const isZodModule = (id: string) =>
	id.includes('/node_modules/zod/') || id.includes('/node_modules/.pnpm/zod@');

describe('preview-release zod patch bundle graph', () => {
	it('does not pull zod into a bundle that only imports the patch helper', async () => {
		const modules = await bundleModules(
			"import { patchZodStandardSchema } from 'astro-preview-zod'; export { patchZodStandardSchema };",
		);

		assert.ok(modules.has(zodPatchModule), 'the patch helper should be bundled');
		assert.deepEqual([...modules].filter(isZodModule), []);
	});

	it('detects zod when a bundle actually imports it', async () => {
		const modules = await bundleModules("import * as z from 'zod/v4'; export { z };");

		assert.ok(
			[...modules].some(isZodModule),
			'expected the zod package to appear so the assertion above is meaningful',
		);
	});
});
