import type fsType from 'fs';
import npath from 'path';
import { pathToFileURL } from 'url';
import * as vite from 'vite';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';

// Fallback for legacy
import load from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';

load.use([loadTypeScript]);

export interface ViteLoader {
	root: string;
	viteServer: vite.ViteDevServer;
}

async function createViteLoader(root: string, fs: typeof fsType): Promise<ViteLoader> {
	const viteServer = await vite.createServer({
		server: { middlewareMode: true, hmr: false },
		optimizeDeps: { entries: [] },
		clearScreen: false,
		appType: 'custom',
		ssr: {
			// NOTE: Vite doesn't externalize linked packages by default. During testing locally,
			// these dependencies trip up Vite's dev SSR transform. In the future, we should
			// avoid `vite.createServer` and use `loadConfigFromFile` instead.
			external: ['@astrojs/tailwind', '@astrojs/mdx', '@astrojs/react'],
		},
		plugins: [loadFallbackPlugin({ fs, root: pathToFileURL(root) })],
	});

	return {
		root,
		viteServer,
	};
}

async function stat(fs: typeof fsType, configPath: string, mustExist: boolean): Promise<boolean> {
	try {
		await fs.promises.stat(configPath);
		return true;
	} catch {
		if (mustExist) {
			throw new AstroError({
				...AstroErrorData.ConfigNotFound,
				message: AstroErrorData.ConfigNotFound.message(configPath),
			});
		}
		return false;
	}
}

async function search(fs: typeof fsType, root: string) {
	const paths = [
		'astro.config.mjs',
		'astro.config.js',
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cjs',
		'astro.config.cjs',
	].map((path) => npath.join(root, path));

	for (const file of paths) {
		// First verify the file event exists
		const exists = await stat(fs, file, false);
		if (exists) {
			return file;
		}
	}
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
	let file: string;
	if (configPath) {
		// Go ahead and check if the file exists and throw if not.
		await stat(fs, configPath, true);
		file = configPath;
	} else {
		const found = await search(fs, root);
		if (!found) {
			// No config file found, return an empty config that will be populated with defaults
			return {
				value: {},
				filePath: undefined,
			};
		} else {
			file = found;
		}
	}

	// Try loading with Node import()
	if (/\.[cm]?js$/.test(file)) {
		try {
			const config = await import(pathToFileURL(file).toString());
			return {
				value: config.default ?? {},
				filePath: file,
			};
		} catch {
			// We do not need to keep the error here because with fallback the error will be rethrown
			// when/if it fails in Proload.
		}
	}

	Error.stackTraceLimit = 100;
	// Try Loading with Vite
	let loader: ViteLoader | undefined;
	try {
		loader = await createViteLoader(root, fs);
		const mod = await loader.viteServer.ssrLoadModule(file);
		return {
			value: mod.default ?? {},
			filePath: file,
		};
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log('vite error', e);
		// Try loading with Proload
		// TODO deprecate - this is only for legacy compatibility
		const res = await load('astro', {
			mustExist: true,
			cwd: root,
			filePath: file,
		});
		return {
			value: res?.value ?? {},
			filePath: file,
		};
	} finally {
		if (loader) {
			await loader.viteServer.close();
		}
	}
}
