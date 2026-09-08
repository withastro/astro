import type fsMod from 'node:fs';
// `es-module-lexer` compiles WebAssembly when this module is evaluated. It is
// deliberately kept out of `actions/utils.js`, which the `astro:actions`
// runtime graph reaches: restricted runtimes (Cloudflare Workers) disallow
// wasm code generation. This module is only loaded by dev/build config code.
// https://github.com/withastro/astro/issues/17906
import * as eslexer from 'es-module-lexer';

/**
 * Check whether the Actions config file is present.
 */
export async function isActionsFilePresent(fs: typeof fsMod, srcDir: URL) {
	await eslexer.init;

	const actionsFile = search(fs, srcDir);
	if (!actionsFile) return false;

	let contents: string;
	try {
		contents = fs.readFileSync(actionsFile.url, 'utf-8');
	} catch {
		return false;
	}

	// Check if `server` export is present.
	// If not, the user may have an empty `actions` file,
	// or may be using the `actions` file for another purpose
	// (possible since actions are non-breaking for v4.X).
	const [, exports] = eslexer.parse(contents, actionsFile.url.pathname);
	for (const exp of exports) {
		if (exp.n === 'server') {
			return actionsFile.filename;
		}
	}
	return false;
}

function search(fs: typeof fsMod, srcDir: URL) {
	const filenames = [
		'actions.mjs',
		'actions.js',
		'actions.mts',
		'actions.ts',
		'actions/index.mjs',
		'actions/index.js',
		'actions/index.mts',
		'actions/index.ts',
	];
	for (const filename of filenames) {
		const url = new URL(filename, srcDir);
		if (fs.existsSync(url)) {
			return { filename, url };
		}
	}
	return undefined;
}
