const { watchMode } = require('./utils.js');
const isDev = process.argv.includes('--watch');
const shouldBeEmpty = process.argv.includes('--empty');

require('esbuild')
	.build({
		entryPoints: shouldBeEmpty
			? {
					client: './scripts/empty.js',
			  }
			: {
					client: './src/browser.ts',
			  },
		bundle: true,
		sourcemap: isDev ? true : false,
		outdir: './dist/browser',
		external: ['vscode'],
		format: 'cjs',
		tsconfig: './tsconfig.json',
		minify: isDev ? false : true,
		watch: isDev ? watchMode : false,
	})
	.catch(() => process.exit(1));

require('esbuild').build({
	entryPoints: shouldBeEmpty
		? {
				server: './scripts/empty.js',
		  }
		: {
				server: '../language-server/dist/browser.js',
		  },
	bundle: true,
	sourcemap: isDev ? true : false,
	outdir: './dist/browser',
	platform: 'browser',
	format: 'iife',
	tsconfig: './tsconfig.json',
	external: ['synckit'],
	minify: isDev ? false : true,
	watch: isDev ? watchMode : false,
	plugins: [
		{
			name: 'node-deps',
			setup(build) {
				build.onResolve({ filter: /^vscode-.*-languageservice/ }, (args) => {
					const pathUmdMay = require.resolve(args.path, { paths: [args.resolveDir] });
					const pathEsm = pathUmdMay.replace('/umd/', '/esm/');
					return { path: pathEsm };
				});
				build.onResolve({ filter: /^@vscode\/emmet-helper$/ }, (args) => {
					const pathCjsMay = require.resolve(args.path, { paths: [args.resolveDir] });
					const pathEsm = pathCjsMay.replace('/cjs/', '/esm/');
					return { path: pathEsm };
				});
				build.onResolve({ filter: /^path$/ }, (args) => {
					const pathBrowserify = require.resolve('path-browserify', {
						paths: [__dirname],
					});
					return { path: pathBrowserify };
				});
				build.onResolve({ filter: /^util$/ }, (args) => ({
					path: args.path,
					namespace: 'util-ns',
				}));
				build.onLoad({ filter: /.*/, namespace: 'util-ns' }, () => ({
					contents: `export const TextDecoder = {}`,
					loader: 'js',
				}));
			},
		},
	],
});
