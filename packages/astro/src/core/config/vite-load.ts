import * as vite from 'vite';
import npath from 'path';

export interface ViteLoader {
	root: string;
	viteServer: vite.ViteDevServer;
}

async function createViteLoader(root: string): Promise<ViteLoader> {
	const viteServer = await vite.createServer({
		server: { middlewareMode: true, hmr: false },
		optimizeDeps: { entries: [] },
		clearScreen: false,
		appType: 'custom',
		ssr: {
			// NOTE: Vite doesn't externalize linked packages by default. During testing locally,
			// these dependencies trip up Vite's dev SSR transform. In the future, we should
			// avoid `vite.createServer` and use `loadConfigFromFile` instead.
			external: ['@astrojs/tailwind', '@astrojs/mdx', '@astrojs/react']
		}
	});

	return {
		root,
		viteServer,
	};
}

interface TryLoadResult {
	value: Record<string, any>;
	filePath?: string;
}

async function tryLoadWith(root: string, paths: string[], cb: (path: string) => Promise<Record<string, any>>): Promise<TryLoadResult | null> {
	for(const path of paths) {
		const file = npath.join(root, path);
		try {
			const config = await cb(file);
			return {
				value: config.default ?? {},
				filePath: file
			};
		} catch {}
	}
	return null;
}

export async function loadConfigWithVite(root: string): Promise<{
	value: Record<string, any>;
	filePath?: string;
}> {
	let config = await tryLoadWith(root, ['astro.config.mjs', 'astro.config.js'], path => import(path));
	if(config) {
		return config;
	}

	const loader = await createViteLoader(root);
	config = await tryLoadWith(root, [
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cts'
	], async path => {
		const mod = await loader.viteServer.ssrLoadModule(path);
		await loader.viteServer.close();
		return mod;
	});

	if(config) {
		return config;
	}

	await loader.viteServer.close();
	throw new Error(`Unable to find a config in ${root}`);
}
