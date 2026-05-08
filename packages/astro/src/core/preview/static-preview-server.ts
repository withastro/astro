import type http from 'node:http';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { mergeConfig, preview, type PreviewServer as VitePreviewServer } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroLogger } from '../logger/core.js';
import * as msg from '../messages/runtime.js';
import { getResolvedHostForHttpServer } from './util.js';
import { vitePluginAstroPreview } from './vite-plugin-astro-preview.js';
import { BuildTimeAstroVersionProvider } from '../../cli/infra/build-time-astro-version-provider.js';
import { piccoloreTextStyler } from '../../cli/infra/piccolore-text-styler.js';

interface PreviewServer {
	host?: string;
	port: number;
	server: http.Server;
	closed(): Promise<void>;
	stop(): Promise<void>;
}

export default async function createStaticPreviewServer(
	settings: AstroSettings,
	logger: AstroLogger,
): Promise<PreviewServer> {
	const startServerTime = performance.now();

	let previewServer: VitePreviewServer;
	try {
		// Build the Astro-specific preview config
		const astroPreviewConfig: vite.InlineConfig = {
			configFile: false,
			base: settings.config.base,
			appType: 'mpa',
			build: {
				outDir: fileURLToPath(settings.config.outDir),
			},
			root: fileURLToPath(settings.config.root),
			preview: {
				host: settings.config.server.host,
				port: settings.config.server.port,
				headers: settings.config.server.headers,
				open: settings.config.server.open,
			},
			plugins: [vitePluginAstroPreview(settings)],
		};

		// Merge user's vite config (from astro.config.mjs `vite` field) as the base,
		// then apply Astro's overrides on top. This ensures vite.preview.* settings
		// are respected while Astro-specific values (like configFile: false) always win.
		// Plugins are excluded from the user config since Astro manages its own plugin set.
		const { plugins: _plugins, ...userViteConfig } = settings.config.vite ?? {};
		const mergedViteConfig = mergeConfig(userViteConfig, astroPreviewConfig);

		// Apply allowedHosts after merging to avoid Vite's array concatenation behavior.
		// If the user explicitly set server.allowedHosts in Astro config (boolean or non-empty
		// array), that takes precedence. Otherwise, the user's vite.preview.allowedHosts from
		// settings.config.vite (merged above) is preserved.
		const { allowedHosts } = settings.config.server;
		if (
			typeof allowedHosts === 'boolean' ||
			(Array.isArray(allowedHosts) && allowedHosts.length > 0)
		) {
			mergedViteConfig.preview ??= {};
			mergedViteConfig.preview.allowedHosts = allowedHosts;
		}

		previewServer = await preview(mergedViteConfig);
	} catch (err) {
		if (err instanceof Error) {
			logger.error(null, err.stack || err.message);
		}
		throw err;
	}

	// Set up shortcuts

	const customShortcuts: Array<vite.CLIShortcut> = [
		// Disable default Vite shortcuts that don't work well with Astro
		{ key: 'r', description: '' },
		{ key: 'u', description: '' },
		{ key: 'c', description: '' },
		{ key: 's', description: '' },
	];

	previewServer.bindCLIShortcuts({
		customShortcuts,
	});

	// Log server start URLs
	logger.info(
		'SKIP_FORMAT',
		msg.serverStart({
			startupTime: performance.now() - startServerTime,
			resolvedUrls: previewServer.resolvedUrls ?? { local: [], network: [] },
			host: settings.config.server.host,
			base: settings.config.base,
			astroVersionProvider: new BuildTimeAstroVersionProvider(),
			textStyler: piccoloreTextStyler,
		}),
	);

	// Resolves once the server is closed
	function closed() {
		return new Promise<void>((resolve, reject) => {
			previewServer.httpServer.addListener('close', resolve);
			previewServer.httpServer.addListener('error', reject);
		});
	}

	// Read the actual bound port from the HTTP server, not the configured port.
	// This is important when port 0 is used (OS-assigned port).
	const address = previewServer.httpServer.address();
	const actualPort =
		address && typeof address === 'object' ? address.port : settings.config.server.port;

	return {
		host: getResolvedHostForHttpServer(settings.config.server.host),
		port: actualPort,
		closed,
		server: previewServer.httpServer as http.Server,
		stop: previewServer.close.bind(previewServer),
	};
}
