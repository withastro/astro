import * as vite from 'vite';
import npath from 'path';
import { pathToFileURL } from 'url';
import type fsType from 'fs';
import { AstroError, AstroErrorData } from '../errors/index.js';

// Fallback for legacy
import load from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';

load.use([loadTypeScript]);

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

interface LoadConfigWithViteOptions {
	root: string;
	configPath: string | undefined;
	fs: typeof fsType;
}

export async function loadConfigWithVite({ configPath, fs, root }: LoadConfigWithViteOptions): Promise<{
	value: Record<string, any>;
	filePath?: string;
}> {
	let paths: string [];
	if(configPath) {
		// Go ahead and check if the file exists and throw if not.
		try {
			await fs.promises.stat(configPath);
		} catch {
			throw new AstroError({
				...AstroErrorData.ConfigNotFound,
				message: AstroErrorData.ConfigNotFound.message(configPath),
			});
		}

		paths = [configPath];
	} else {
		paths = [
			'astro.config.mjs',
			'astro.config.js',
			'astro.config.ts',
			'astro.config.mts',
			'astro.config.cjs',
			'astro.config.cjs'
		].map(path => npath.join(root, path));
	}

	// Initialize a ViteLoader variable. We may never need to create one
	// but if we do, we only want to create it once.
	let loader: ViteLoader | null = null;

	try {
		for(const file of paths) {
			// First verify the file event exists
			try {
				await fs.promises.stat(file);
			} catch {
				continue;
			}

			// Try loading with Node import()
			if(/\.[cm]?js$/.test(file)) {
				try {
					const config = await import(pathToFileURL(file).toString());
					return {
						value: config.default ?? {},
						filePath: file
					};
				} catch {}
			}
	
			// Try Loading with Vite
			if(!loader) {
				loader = await createViteLoader(root);
			}
	
			try {
				const mod = await loader.viteServer.ssrLoadModule(file);
				return {
					value: mod.default ?? {},
					filePath: file
				}
			} catch {}
	
			// Try loading with Proload
			// TODO deprecate - this is only for legacy compatibility
			try {
				const res = await load('astro', {
					mustExist: true,
					cwd: root,
					filePath: file,
				});
				return {
					value: res?.value ?? {},
					filePath: file
				};
			} catch {}
		}
	} finally {
		// Tear-down the ViteLoader, if one was created.
		if(loader) {
			await loader.viteServer.close();
		}
	}

	if(configPath) {
		throw new AstroError({
			...AstroErrorData.ConfigNotFound,
			message: `Unable to find an Astro config file.`,
		});
	}

	return {
		value: {},
		filePath: undefined
	};
}
