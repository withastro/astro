// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { rolldown, watch } from 'rolldown';
import { logError, logUpdated } from './shared.mjs';

const require = createRequire(import.meta.url);

const isDev = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

/**
 * Resolve UMD builds of `vscode-*-languageservice` and `jsonc-parser` to their
 * ESM counterparts.
 * @returns {import('rolldown').Plugin}
 */
function umd2esm() {
	return {
		name: 'umd2esm',
		resolveId(source, importer) {
			if (/^(?:vscode-.*-languageservice|jsonc-parser)/.test(source)) {
				const resolveDir = importer ? path.dirname(importer) : process.cwd();
				const pathUmdMay = require.resolve(source, { paths: [resolveDir] });
				// Call twice the replace is to solve the problem of the path in Windows
				const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\');
				return pathEsm;
			}
		},
	};
}

/**
 * Copy the language server types into `dist/types` so VS Code can resolve them.
 * @returns {import('rolldown').Plugin}
 */
function copyTypes() {
	return {
		name: 'astro:copy-types',
		async writeBundle() {
			await fs.promises.cp('../language-server/types', './dist/types', {
				recursive: true,
				filter: (src) => fs.statSync(src).isDirectory() || src.endsWith('.d.ts'),
			});
		},
	};
}

/** @type {Record<string, string>} */
const entries = {
	'dist/node/client': './src/client.ts',
	'dist/node/server': './node_modules/@astrojs/language-server/bin/nodeServer.js',
	// We need to generate this inside node_modules so VS Code can resolve it
	'node_modules/astro-ts-plugin-bundle/index': './node_modules/@astrojs/ts-plugin/dist/index.js',
};

/**
 * Each entry is bundled on its own so shared code is inlined instead of emitted
 * as extra chunks.
 * @param {string} name
 * @param {string} input
 */
function config(name, input) {
	return {
		input,
		platform: /** @type {const} */ ('node'),
		external: ['vscode', '@astrojs/astro2tsx', 'prettier', 'prettier-plugin-astro'],
		tsconfig: './tsconfig.json',
		transform: {
			define: { 'process.env.NODE_ENV': '"production"' },
		},
		plugins: [copyTypes(), umd2esm()],
		output: {
			dir: '.',
			format: /** @type {const} */ ('cjs'),
			sourcemap: isDev,
			minify,
			codeSplitting: false,
			entryFileNames: `${name}.js`,
		},
	};
}

export default async function build() {
	const configs = Object.entries(entries).map(([name, input]) => config(name, input));

	if (!isDev) {
		for (const options of configs) {
			const bundle = await rolldown(options);
			try {
				await bundle.write(options.output);
			} finally {
				await bundle.close();
			}
		}
		return;
	}

	const watcher = watch(configs);
	watcher.on('event', (event) => {
		if (event.code === 'ERROR') {
			logError(event.error);
		} else if (event.code === 'END') {
			logUpdated();
		}
	});

	process.on('beforeExit', () => {
		void watcher.close();
	});
}

void build();
