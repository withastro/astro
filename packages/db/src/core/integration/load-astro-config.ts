import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { bold, red } from 'kleur/colors';
import { type ViteDevServer, createServer } from 'vite';

/**
 * Pulled from the mothership, Astro core ❤️
 *
 * @see https://github.com/withastro/astro/blob/main/packages/astro/src/core/config/config.ts#L121
 */
export async function loadAstroConfig(root: string): Promise<Record<string, unknown>> {
	const configPath = search(root);
	if (!configPath) return {};

	// Create a vite server to load the config
	try {
		return await loadConfigWithVite(configPath);
	} catch (e) {
		// Config errors should bypass log level as it breaks startup

		// eslint-disable-next-line no-console
		console.error(`${bold(red('[astro]'))} Unable to load Astro config.\n`);
		throw e;
	}
}

function search(root: string) {
	const paths = [
		'astro.config.mjs',
		'astro.config.js',
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cjs',
		'astro.config.cts',
	].map((p) => path.join(root, p));

	for (const file of paths) {
		if (fs.existsSync(file)) {
			return file;
		}
	}
}

async function loadConfigWithVite(configPath: string): Promise<Record<string, unknown>> {
	if (/\.[cm]?js$/.test(configPath)) {
		try {
			const config = await import(
				/* @vite-ignore */ pathToFileURL(configPath).toString() + '?t=' + Date.now()
			);
			return config.default ?? {};
		} catch (e) {
			// We do not need to throw the error here as we have a Vite fallback below
		}
	}

	// Try Loading with Vite
	let server: ViteDevServer | undefined;
	try {
		server = await createViteServer();
		const mod = await server.ssrLoadModule(configPath, { fixStacktrace: true });
		return mod.default ?? {};
	} finally {
		if (server) {
			await server.close();
		}
	}
}

async function createViteServer(): Promise<ViteDevServer> {
	const viteServer = await createServer({
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
	});

	return viteServer;
}
