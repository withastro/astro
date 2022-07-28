import type { AstroAdapter, AstroConfig, AstroIntegration, BuildConfig } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

type Options = {
	mode: 'directory' | 'advanced';
};

export function getAdapter(isModeDirectory: boolean): AstroAdapter {
	return isModeDirectory
		? {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.directory.js',
				exports: ['onRequest'],
		  }
		: {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.advanced.js',
				exports: ['default'],
		  };
}

const SHIM = `globalThis.process = {
	argv: [],
	env: {},
};`;

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let _buildConfig: BuildConfig;
	const isModeDirectory = args?.mode === 'directory';

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter(isModeDirectory));
				_config = config;

				if (config.output === 'static') {
					throw new Error(`
  [@astrojs/cloudflare] \`output: "server"\` is required to use this adapter. Otherwise, this adapter is not necessary to deploy a static site to Cloudflare.

`);
				}
			},
			'astro:build:start': ({ buildConfig }) => {
				_buildConfig = buildConfig;
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.serverEntry = '_worker.js';
				buildConfig.server = new URL('./', _config.outDir);
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve = vite.resolve || {};
					vite.resolve.alias = vite.resolve.alias || {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					vite.ssr = {
						target: 'webworker',
						noExternal: true,
					};
				}
			},
			'astro:build:done': async () => {
				const entryUrl = new URL(_buildConfig.serverEntry, _buildConfig.server);
				const pkg = fileURLToPath(entryUrl);
				await esbuild.build({
					target: 'es2020',
					platform: 'browser',
					entryPoints: [pkg],
					outfile: pkg,
					allowOverwrite: true,
					format: 'esm',
					bundle: true,
					minify: true,
					banner: {
						js: SHIM,
					},
				});

				// throw the server folder in the bin
				const chunksUrl = new URL('./chunks', _buildConfig.server);
				await fs.promises.rm(chunksUrl, { recursive: true, force: true });

				if (isModeDirectory) {
					const functionsUrl = new URL(`file://${process.cwd()}/functions/`);
					await fs.promises.mkdir(functionsUrl, { recursive: true });
					const directoryUrl = new URL('[[path]].js', functionsUrl);
					await fs.promises.rename(entryUrl, directoryUrl);
				}
			},
		},
	};
}
