// @ts-check
import fs from 'node:fs';
import { createRequire } from 'node:module';
import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { rebuildPlugin } from './shared.mjs';

const require = createRequire(import.meta.url);

export default async function build() {
	const isDev = process.argv.includes('--watch');
	const metaFile = process.argv.includes('--metafile');
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

	/**
	 * @satisfies {import('esbuild').BuildOptions}
	 */
	const config = {
		entryPoints: {
			'dist/node/client': './src/client.ts',
			'dist/node/server': './node_modules/@astrojs/language-server/dist/nodeServer.js',
			// We need to generate this inside node_modules so VS Code can resolve it
			'node_modules/astro-ts-plugin-bundle/index':
				'./node_modules/@astrojs/ts-plugin/dist/index.js',
		},
		bundle: true,
		metafile: metaFile,
		sourcemap: isDev,
		outdir: '.',
		external: [
			'vscode',
			'@astrojs/astro2tsx',
			'@astrojs/compiler',
			'prettier',
			'prettier-plugin-astro',
		],
		format: 'esm',
		target: 'node22.12',
		platform: 'node',
		banner: {
			js: [
				"import { createRequire as __astroCreateRequire } from 'node:module';",
				"import { fileURLToPath as __astroFileURLToPath } from 'node:url';",
				"import { dirname as __astroDirname } from 'node:path';",
				'const require = __astroCreateRequire(import.meta.url);',
				'const __filename = __astroFileURLToPath(import.meta.url);',
				'const __dirname = __astroDirname(__filename);',
			].join('\n'),
		},
		tsconfig: './tsconfig.json',
		define: { 'process.env.NODE_ENV': '"production"' },
		minify: process.argv.includes('--minify'),
		plugins: [
			copy({
				resolveFrom: 'cwd',
				assets: {
					from: ['../language-server/types/**/*.d.ts'],
					to: ['./dist/types'],
					watch: isDev,
				},
			}),
			{
				name: 'umd2esm',
				setup(pluginBuild) {
					pluginBuild.onResolve(
						{ filter: /^(vscode-.*-languageservice|jsonc-parser)/ },
						(buildArgs) => {
							const pathUmdMay = require.resolve(buildArgs.path, { paths: [buildArgs.resolveDir] });
							// Call twice the replace is to solve the problem of the path in Windows
							const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\');
							return { path: pathEsm };
						},
					);
				},
			},
		],
	};

	if (!isDev) {
		const result = await esbuild.build(config);
		if (metaFile) fs.writeFileSync('meta.json', JSON.stringify(result.metafile));
		return;
	}

	const builder = await esbuild.context({
		...config,
		plugins: [rebuildPlugin, ...(config.plugins ?? [])],
	});

	await builder.watch();

	process.on('beforeExit', () => {
		void builder.dispose?.();
	});
}

void build();
