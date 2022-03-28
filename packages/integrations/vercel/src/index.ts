import type { AstroIntegration, AstroConfig } from 'astro';
import type { IncomingMessage, ServerResponse } from 'http';
import type { PathLike } from 'fs';

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { globby } from 'globby';
import esbuild from 'esbuild';

export type VercelRequest = IncomingMessage;
export type VercelResponse = ServerResponse;
export type VercelHandler = (request: VercelRequest, response: VercelResponse) => void | Promise<void>;

const writeJson = (path: PathLike, data: any) => fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

const ENDPOINT_GLOB = 'api/**/*.{js,ts,tsx}';

function vercelFunctions(): AstroIntegration {
	let _config: AstroConfig;
	let output: URL;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config, ignorePages }) => {
				output = new URL('./.output/', config.projectRoot);
				config.dist = new URL('./static/', output);
				config.buildOptions.pageUrlFormat = 'directory';
				ignorePages(ENDPOINT_GLOB);
			},
			'astro:config:done': async ({ config }) => {
				_config = config;
			},
			'astro:build:start': async () => {
				await fs.rm(output, { recursive: true, force: true });
			},
			'astro:build:done': async ({ pages }) => {
				// Split pages from the rest of files
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

				const endpoints = await globby([ENDPOINT_GLOB, '!_*'], { onlyFiles: true, cwd: _config.pages });

				if (endpoints.length === 0) return;

				await esbuild.build({
					entryPoints: endpoints.map((endpoint) => new URL(endpoint, _config.pages)).map(fileURLToPath),
					outdir: fileURLToPath(new URL('./server/pages/api/', output)),
					outbase: fileURLToPath(new URL('./api/', _config.pages)),
					inject: [fileURLToPath(new URL('./shims.js', import.meta.url))],
					bundle: true,
					target: 'node14',
					platform: 'node',
					format: 'cjs',
				});

				await writeJson(new URL(`./package.json`, output), { type: 'commonjs' });
			},
		},
	};
}

export default vercelFunctions;
