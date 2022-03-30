import type { AstroAdapter, AstroIntegration } from 'astro';
import type { PathLike } from 'fs';
import fs from 'fs/promises';

const writeJson = (path: PathLike, data: any) => fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/vercel',
		serverEntrypoint: '@astrojs/vercel/server-entrypoint',
		exports: ['_default'],
	};
}

export default function vercel(): AstroIntegration {
	let entryFile: string;

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
				entryFile = buildConfig.serverEntry;
				buildConfig.client = new URL('./static/', config.dist);
				buildConfig.server = new URL('./functions/', config.dist);
			},
			'astro:build:done': async ({ dir, routes }) => {
				await writeJson(new URL(`./functions/package.json`, dir), {
					type: 'commonjs',
				});

				// Routes Manifest
				// https://vercel.com/docs/file-system-api#configuration/routes
				await writeJson(new URL(`./routes-manifest.json`, dir), {
					version: 3,
					basePath: '/',
					pages404: false,
					// redirects: [
					// 	{
					// 		source: '/nice/',
					// 		destination: '/stuff',
					// 		statusCode: 308,
					// 		regex: '^/nice.*$',
					// 	},
					// ],
					rewrites: routes.map((route) => ({
						source: route.pathname,
						destination: '/__astro_entry',
					})),
				});

				// Functions Manifest
				// https://vercel.com/docs/file-system-api#configuration/functions
				await writeJson(new URL(`./functions-manifest.json`, dir), {
					version: 1,
					pages: {
						__astro_entry: {
							runtime: 'nodejs14',
							handler: `functions/${entryFile}`,
						},
					},
				});
			},
		},
	};
}
