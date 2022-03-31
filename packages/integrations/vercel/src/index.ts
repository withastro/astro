import type { AstroAdapter, AstroIntegration } from 'astro';
import type { PathLike } from 'fs';
import fs from 'fs/promises';
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';

const writeJson = (path: PathLike, data: any) => fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

const ENTRYFILE = '__astro_entry';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/vercel',
		serverEntrypoint: '@astrojs/vercel/server-entrypoint',
		exports: ['_default'],
	};
}

export default function vercel(): AstroIntegration {
	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.dist = new URL('./.output/', config.projectRoot);
				config.buildOptions.pageUrlFormat = 'directory';
			},
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter());
			},
			'astro:build:start': async ({ buildConfig, config }) => {
				buildConfig.serverEntry = `${ENTRYFILE}.mjs`;
				buildConfig.client = new URL('./static/', config.dist);
				buildConfig.server = new URL('./server/pages/', config.dist);
			},
			'astro:build:done': async ({ dir, routes }) => {
				const pagesDir = new URL('./server/pages/', dir);

				await esbuild.build({
					entryPoints: [fileURLToPath(new URL(`./${ENTRYFILE}.mjs`, pagesDir))],
					outfile: fileURLToPath(new URL(`./${ENTRYFILE}.js`, pagesDir)),
					bundle: true,
					format: 'cjs',
					platform: 'node',
					target: 'node14',
				});

				await fs.rm(new URL(`./${ENTRYFILE}.mjs`, pagesDir));

				// Routes Manifest
				// https://vercel.com/docs/file-system-api#configuration/routes
				await writeJson(new URL(`./routes-manifest.json`, dir), {
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
