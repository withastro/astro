import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import zodCompiler from 'zod-compiler/esbuild';

// Load the virtual runtime content from zod-compiler.
// zod-compiler's esbuild plugin uses "lean" mode (shared virtual module imports) because
// esbuild is listed in VIRTUAL_MODULE_FRAMEWORKS. Lean mode relies on the bundler resolving
// "virtual:zod-compiler/runtime" via onResolve/onLoad hooks — but those hooks only fire for
// entries in bundle mode, not for imports inside already-transformed files. Without --bundle
// the virtual specifier survives verbatim in dist output and Node rejects it at runtime.
// We reach virtual.js via a file:// URL to bypass the package exports map restriction.
const zodDistDir = path.dirname(fileURLToPath(import.meta.resolve('zod-compiler')));
const virtualJsUrl = pathToFileURL(path.join(zodDistDir, 'unplugin', 'virtual.js')).href;
const { loadVirtual, RESOLVED_RUNTIME_ID } = await import(virtualJsUrl);
const runtimeSrc = loadVirtual(RESOLVED_RUNTIME_ID)
	// Strip `export` from declarations: these become file-local helpers when inlined.
	.replace(/^export (?=(?:function|const) )/gm, '');

/** @type {import('esbuild').Plugin} */
const inlineVirtualRuntime = {
	name: 'zod-compiler-inline-virtual',
	setup(build) {
		build.onEnd(async () => {
			const outdir = build.initialOptions.outdir ?? 'dist';
			let entries;
			try {
				entries = await readdir(outdir, { recursive: true });
			} catch {
				return;
			}
			await Promise.all(
				entries
					.filter((f) => f.endsWith('.js'))
					.map(async (f) => {
						const p = path.join(outdir, f);
						const src = await readFile(p, 'utf8');
						if (!src.includes('virtual:zod-compiler/runtime')) return;
						await writeFile(
							p,
							src.replace(
								/import\s*\{[\s\S]*?\}\s*from\s*['"]virtual:zod-compiler\/runtime['"]\s*;?/,
								runtimeSrc,
							),
						);
					}),
			);
		});
	},
};

export default [zodCompiler({ schemas: 'explicit' }), inlineVirtualRuntime];
