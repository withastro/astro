import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';
import type { PathLike } from 'fs';
import fs from 'fs/promises';
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';

const writeJson = (path: PathLike, data: any) =>
	fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

const ENTRYFILE = '__astro_entry';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/vercel',
		serverEntrypoint: '@astrojs/vercel/server-entrypoint',
		exports: ['_default'],
	};
}

export default function vercel(): AstroIntegration {
	let _config: AstroConfig;
	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.outDir = new URL('./.output/', config.root);
				config.build.format = 'directory';
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				buildConfig.serverEntry = `${ENTRYFILE}.mjs`;
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.server = new URL('./server/tmp/', _config.outDir);
			},
			'astro:build:done': async ({ routes }) => {
				/*
					Why do we need two folders? Why don't we just generate all inside `server/pages/`?
					When the app builds, it throws some metadata inside a `chunks/` folder.

					./server/
						pages/
							__astro_entry.mjs
							chunks/
								(lots of js files)
					
					Those chunks will count as serverless functions (which cost money), so we
					need to bundle as much as possible in one file. Hence, the following code
				*/

				const tmpDir = new URL('./server/tmp/', _config.outDir);
				const bundleDir = new URL('./server/pages/', _config.outDir);

				await fs.mkdir(bundleDir, { recursive: true });

				// Convert server entry to CommonJS
				await esbuild.build({
					entryPoints: [fileURLToPath(new URL(`./${ENTRYFILE}.mjs`, tmpDir))],
					outfile: fileURLToPath(new URL(`./${ENTRYFILE}.js`, bundleDir)),
					bundle: true,
					format: 'cjs',
					platform: 'node',
					target: 'node14',
				});

				await fs.rm(tmpDir, { recursive: true });

				// Routes Manifest
				// https://vercel.com/docs/file-system-api#configuration/routes
				await writeJson(new URL(`./routes-manifest.json`, _config.outDir), {
					version: 3,
					basePath: '/',
					pages404: false,
					rewrites: routes.map((route) => ({
						source: route.pathname,
						destination: `/${ENTRYFILE}`,
					})),
				});
			},
		},
	};
}
