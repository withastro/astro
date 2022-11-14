const { watchMode } = require('./utils.js');
const isDev = process.argv.includes('--watch');

require('esbuild')
	.build({
		entryPoints: process.argv.includes('--empty')
			? {
					client: './scripts/empty.js',
					server: './scripts/empty.js',
			  }
			: {
					client: './src/node.ts',
					server: '../language-server/dist/node.js',
					TSXWorker: '../language-server/dist/core/worker/TSXWorker.js',
			  },
		bundle: true,
		sourcemap: isDev ? true : false,
		outdir: './dist/node',
		external: ['vscode', './TSXWorker'],
		format: 'cjs',
		platform: 'node',
		tsconfig: './tsconfig.json',
		minify: isDev ? false : true,
		watch: isDev ? watchMode : false,
		plugins: [
			{
				name: 'umd2esm',
				setup(build) {
					build.onResolve({ filter: /^(vscode-.*|estree-walker|jsonc-parse)/ }, (args) => {
						const pathUmd = require.resolve(args.path, { paths: [args.resolveDir] });
						const pathEsm = pathUmd.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\');
						return { path: pathEsm };
					});
					build.onResolve({ filter: /^@vscode\/emmet-helper$/ }, (args) => {
						const pathCjsMay = require.resolve(args.path, { paths: [args.resolveDir] });
						const pathEsm = pathCjsMay.replace('/cjs/', '/esm/').replace('\\cjs\\', '\\esm\\');
						return { path: pathEsm };
					});
				},
			},
			require('esbuild-plugin-copy').copy({
				resolveFrom: 'cwd',
				assets: {
					from: ['../language-server/types/**/*.d.ts'],
					to: ['./dist/types'],
					keepStructure: true,
				},
			}),
		],
	})
	.catch(() => process.exit(1));
