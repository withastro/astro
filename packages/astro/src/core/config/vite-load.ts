import type fsType from 'fs';
import { pathToFileURL } from 'url';
import * as vite from 'vite';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { debug } from '../logger/core.js';

interface ViteLoader {
	root: string;
	viteServer: vite.ViteDevServer;
}

async function createViteLoader(root: string, fs: typeof fsType): Promise<ViteLoader> {
	const viteServer = await vite.createServer({
		server: { middlewareMode: true, hmr: false, watch: { ignored: ['**'] } },
		optimizeDeps: { disabled: true },
		clearScreen: false,
		appType: 'custom',
		ssr: {
			// NOTE: Vite doesn't externalize linked packages by default. During testing locally,
			// these dependencies trip up Vite's dev SSR transform. Awaiting upstream feature:
			// https://github.com/vitejs/vite/pull/10939
			external: [
				'@astrojs/tailwind',
				'@astrojs/mdx',
				'@astrojs/react',
				'@astrojs/preact',
				'@astrojs/sitemap',
				'@astrojs/markdoc',
			],
		},
		plugins: [loadFallbackPlugin({ fs, root: pathToFileURL(root) })],
	});

	return {
		root,
		viteServer,
	};
}

interface LoadConfigWithViteOptions {
	root: string;
	configPath: string;
	fs: typeof fsType;
}

export async function loadConfigWithVite({
	configPath,
	fs,
	root,
}: LoadConfigWithViteOptions): Promise<Record<string, any>> {
	if (/\.[cm]?js$/.test(configPath)) {
		try {
			const config = await import(pathToFileURL(configPath).toString() + '?t=' + Date.now());
			return config.default ?? {};
		} catch (e) {
			// We do not need to throw the error here as we have a Vite fallback below
			debug('Failed to load config with Node', e);
		}
	}

	// Try Loading with Vite
	let loader: ViteLoader | undefined;
	try {
		loader = await createViteLoader(root, fs);
		const mod = await loader.viteServer.ssrLoadModule(configPath);
		return mod.default ?? {};
	} finally {
		if (loader) {
			await loader.viteServer.close();
		}
	}
}
