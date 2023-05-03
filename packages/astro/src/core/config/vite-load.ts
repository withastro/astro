import type fsType from 'fs';
import { pathToFileURL } from 'url';
import * as vite from 'vite';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';

export interface ViteLoader {
	root: string;
	viteServer: vite.ViteDevServer;
}

async function createViteLoader(root: string, fs: typeof fsType): Promise<ViteLoader> {
	const viteServer = await vite.createServer({
		server: { middlewareMode: true, hmr: false },
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
	configPath: string | undefined;
	fs: typeof fsType;
}

export async function loadConfigWithVite({
	configPath,
	fs,
	root,
}: LoadConfigWithViteOptions): Promise<{
	value: Record<string, any>;
	filePath?: string;
}> {
	// No config file found, return an empty config that will be populated with defaults
	if (!configPath) {
		return {
			value: {},
			filePath: undefined,
		};
	}

	// Try loading with Node import()
	if (/\.[cm]?js$/.test(configPath)) {
		try {
			const config = await import(pathToFileURL(configPath).toString());
			return {
				value: config.default ?? {},
				filePath: configPath,
			};
		} catch {
			// We do not need to keep the error here because with fallback the error will be rethrown
			// when/if it fails in Vite.
		}
	}

	// Try Loading with Vite
	let loader: ViteLoader | undefined;
	try {
		loader = await createViteLoader(root, fs);
		const mod = await loader.viteServer.ssrLoadModule(configPath);
		return {
			value: mod.default ?? {},
			filePath: configPath,
		};
	} finally {
		if (loader) {
			await loader.viteServer.close();
		}
	}
}
