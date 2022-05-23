import { type VitePluginPWAAPI, VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import type { AstroIntegration, AstroConfig, RouteData } from 'astro';
import type { Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import { resolve as resolveFs } from 'path';
import type { ManifestEntry } from 'workbox-build';
import { fileURLToPath, pathToFileURL } from 'url';

function buildManifestEntry(
	publicDir: string,
	url: string,
	path: string,
): Promise<ManifestEntry> {
	return new Promise((resolve, reject) => {
		const cHash = crypto.createHash('MD5');
		const stream = fs.createReadStream(resolveFs(publicDir, path));
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
	// todo@userquin: change this when fixed on Astro build
	// const dontCacheBustURLsMatching = /\.[a-f0-9]{8}\./
	const dontCacheBustURLsMatching = /\.[a-f0-9]{8,9}\./
	if (options.strategies === 'injectManifest') {
		options.injectManifest = options.injectManifest ?? {}
		if (!options.injectManifest.dontCacheBustURLsMatching)
			options.injectManifest.dontCacheBustURLsMatching = dontCacheBustURLsMatching
	}
	else {
		options.workbox = options.workbox ?? {}
		if (!options.workbox.dontCacheBustURLsMatching)
			options.workbox.dontCacheBustURLsMatching = dontCacheBustURLsMatching
	}
	return {
		plugins: [VitePWA(options)]
	}
}

function patchWindowsImportPath(path: string) {
	if (path.match(/^file:\/\/\/\w+:\//))
		return `/${path.slice(8)}`
	else
		return path
}

async function regeneratePWA(dir: URL, routes: RouteData[], pwaPlugin: Plugin | undefined) {
	const api: VitePluginPWAAPI | undefined = pwaPlugin?.api
	// todo@userquin: wait to fix it on pwa plugin
	// if (routes && api && !api.isDisabled()) {
	if (routes && api) {
		// todo@userquin: this is an initial version, should change all the logic
		// disambiguate the `<UNIT>:/` on windows: see nodejs/node#31710
		let distFolder = patchWindowsImportPath(dir.href)
		if (process.platform === 'win32' && distFolder.startsWith('/'))
			distFolder = fileURLToPath(pathToFileURL(distFolder.slice(1)).href)
		// eslint-disable-next-line no-console
		console.log(distFolder)
		const addRoutes = await Promise.all(routes.filter(r => r.type === 'page').map((r) => {
			let path = r.component.slice(9, r.component.lastIndexOf('.'))
			// eslint-disable-next-line no-console
			console.log(path)
			path = path === '/index' ? '/index.html' : (path === r.pathname ? `${path}/index.html` : `${path}/`)
			// eslint-disable-next-line no-console
			console.log(`${path} => ${r.pathname}`)
			return buildManifestEntry(distFolder, r.pathname!, path.slice(1))
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
