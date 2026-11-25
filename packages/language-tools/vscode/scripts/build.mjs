// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { rolldown, watch } from 'rolldown';
import { logError, logUpdated } from './shared.mjs';

const require = createRequire(import.meta.url);

const isDev = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

/** @returns {import('rolldown').Plugin} */
function umd2esm() {
	return {
		name: 'umd2esm',
		resolveId(source, importer) {
			if (/^(?:vscode-.*-languageservice|jsonc-parser)/.test(source)) {
				const resolveDir = importer ? path.dirname(importer) : process.cwd();
				const pathUmdMay = require.resolve(source, { paths: [resolveDir] });
				const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\');
				return pathEsm;
			}
		},
	};
}

/** @returns {import('rolldown').Plugin} */
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

const entries = {
	'dist/node/client': './src/client.ts',
	'dist/node/server': './node_modules/@astrojs/language-server/dist/nodeServer.js',
	'node_modules/astro-ts-plugin-bundle/index': './node_modules/@astrojs/ts-plugin/dist/index.js',
};

/** @param {string} name @param {string} input */
function config(name, input) {
	return {
		input,
		platform: /** @type {const} */ ('node'),
		external: [
			'vscode',
			'@astrojs/astro2tsx',
			'@astrojs/compiler',
			'prettier',
			'prettier-plugin-astro',
		],
		tsconfig: './tsconfig.json',
		transform: { define: { 'process.env.NODE_ENV': '"production"' } },
		plugins: [copyTypes(), umd2esm()],
		output: {
			dir: '.',
			format: /** @type {const} */ ('esm'),
			sourcemap: isDev,
			minify,
			codeSplitting: false,
			entryFileNames: `${name}.js`,
			banner: [
				"import { createRequire as __astroCreateRequire } from 'node:module';",
				"import { fileURLToPath as __astroFileURLToPath } from 'node:url';",
				"import { dirname as __astroDirname } from 'node:path';",
				'const require = __astroCreateRequire(import.meta.url);',
				'const __filename = __astroFileURLToPath(import.meta.url);',
				'const __dirname = __astroDirname(__filename);',
			].join('\n'),
		},
	};
}

export default async function build() {
	const pluginDir = 'node_modules/astro-ts-plugin-bundle';
	fs.mkdirSync(pluginDir, { recursive: true });
	fs.writeFileSync(
		`${pluginDir}/package.json`,
		JSON.stringify({
			name: 'astro-ts-plugin-bundle',
			private: true,
			type: 'module',
			main: './index.js',
		}),
	);

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
