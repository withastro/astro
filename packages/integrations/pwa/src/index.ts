import { type VitePluginPWAAPI, VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import type { AstroConfig, AstroIntegration, RouteData } from 'astro';
import type { Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import type { ManifestEntry } from 'workbox-build';


function buildManifestEntry(
	url: string,
	path: URL,
): Promise<ManifestEntry> {
	return new Promise((resolve, reject) => {
		const cHash = crypto.createHash('MD5');
		const stream = fs.createReadStream(path);
		stream.on('error', (err) => {
			reject(err)
		});
		stream.on('data', (chunk) => {
			cHash.update(chunk)
		});
		stream.on('end', () => {
			return resolve({
				url,
				revision: `${cHash.digest('hex')}`,
			})
		});
	})
}

function lookupPWAVitePlugin(config: AstroConfig) {
	const plugins = config.vite.plugins ?? [];
	for (const p of plugins) {
		if (Array.isArray(p)) {
			return p.find(p1 =>
				p1
				&& !Array.isArray(p1)
				&& p1.name === 'vite-plugin-pwa',
			) as Plugin;
		}
	}
	
	return undefined;
}

function getViteConfiguration(config: AstroConfig, options: Partial<VitePWAOptions>) {
	if (lookupPWAVitePlugin(config)) {
		throw new Error("Remove the vite-plugin-pwa plugin from Astro Vite Plugins entry, use only @astrojs/pwa integration");
	}
	
	return {
		plugins: [VitePWA(options)]
	}
}

async function regeneratePWA(
	dir: URL, 
	routes: RouteData[],
	pwaPlugin: Plugin | undefined
) {
	const api: VitePluginPWAAPI | undefined = pwaPlugin?.api
	if (routes && api && !api.disabled) {
		// todo@userquin: rn we only add the static pages, we should exclude dynamic routes
		const addRoutes = await Promise.all(routes.filter(
			r => r.type === 'page' && r.pathname && r.distURL
		).map((r) => {
			return buildManifestEntry(r.pathname!, r.distURL!)
		}))
		api.extendManifestEntries((manifestEntries) => {
			manifestEntries.push(...addRoutes)
			return manifestEntries
		})
		// generate the manifest.webmanifest file
		api.generateBundle()
		// regenerate the sw
		await api.generateSW()
	}
}

export default function (options: Partial<VitePWAOptions> = {}): AstroIntegration {
	let pwaPlugin: Plugin | undefined
	return {
		name: '@astrojs/pwa',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				updateConfig({ vite: getViteConfiguration(config, options) });
			},
			'astro:config:done': ({ config }) => {
				pwaPlugin = lookupPWAVitePlugin(config)
			},
			'astro:build:done': async ({ dir, routes }) => {
				await regeneratePWA(dir, routes, pwaPlugin)
			}
		},
	};
}
