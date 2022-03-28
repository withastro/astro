import type { AstroIntegration, AstroConfig } from 'astro';
import fs from 'fs/promises';
import type { PathLike } from 'fs';

export type { VercelApiHandler, VercelRequest, VercelRequestBody, VercelRequestCookies, VercelRequestQuery, VercelResponse } from '@vercel/node';

const writeJson = (path: PathLike, data: any) => fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

export function vercelFunctions(): AstroIntegration {
	let _config: AstroConfig;
	let output: URL;
	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				output = new URL('./.output/', config.projectRoot);
				config.dist = new URL('./static/', output);
				config.buildOptions.pageUrlFormat = 'directory';
			},
			'astro:config:done': async ({ config, setAdapter }) => {
				// setAdapter(getAdapter(config.buildOptions.site));
				_config = config;
			},
			'astro:build:start': async () => {
				await fs.rm(output, { recursive: true });
			},
			'astro:build:done': async ({ pages }) => {
				await Promise.all(
					pages.map(async ({ pathname }) => {
						const origin = new URL(`./static/${pathname}index.html`, output);
						const finalDir = new URL(`./server/pages/${pathname}`, output);

						await fs.mkdir(finalDir, { recursive: true });
						await fs.copyFile(origin, new URL(`./index.html`, finalDir));
						await fs.rm(origin);
					})
				);

				// Routes Manifest
				// https://vercel.com/docs/file-system-api#configuration/routes
				await writeJson(new URL(`./routes-manifest.json`, output), {
					version: 3,
					basePath: '/',
					pages404: false,
				});
			},
		},
	};
}

export default vercelFunctions;
