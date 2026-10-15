import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

interface Payload {
	settings: AstroSettings;
}

export function vitePluginChromedevtools({ settings }: Payload): Plugin {
	return {
		name: 'astro:chromedevtools',
		configureServer(viteServer) {
			// Chrome DevTools workspace handler
			// See https://chromium.googlesource.com/devtools/devtools-frontend/+/main/docs/ecosystem/automatic_workspace_folders.md
			viteServer.middlewares.use(async function chromeDevToolsHandler(request, response, next) {
				if (request.url !== '/.well-known/appspecific/com.chrome.devtools.json') {
					return next();
				}
				if (!settings.config.experimental.chromeDevtoolsWorkspace) {
					// Return early to stop console spam
					response.writeHead(404);
					response.end();
					return;
				}

				const pluginVersion = '1.1';
				const cacheDir = settings.config.cacheDir;
				const configPath = new URL('./chrome-workspace.json', cacheDir);

				if (!existsSync(cacheDir)) {
					await mkdir(cacheDir, { recursive: true });
				}

				let config;
				try {
					config = JSON.parse(await readFile(configPath, 'utf-8'));
					// If the cached workspace config was created with a previous version of this plugin,
					// we throw an error so it gets recreated in the `catch` block below.
					if (config.version !== pluginVersion) throw new Error('Cached config is outdated.');
				} catch {
					config = {
						workspace: {
							version: pluginVersion,
							uuid: crypto.randomUUID(),
							root: fileURLToPath(settings.config.root),
						},
					};
					await writeFile(configPath, JSON.stringify(config));
				}

				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify(config));
				return;
			});
		},
	};
}
