import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { mergeConfig, preview } from 'vite';
import * as msg from '../messages/runtime.js';
import { getResolvedHostForHttpServer } from './util.js';
import { vitePluginAstroPreview } from './vite-plugin-astro-preview.js';
import { BuildTimeAstroVersionProvider } from '../../cli/infra/build-time-astro-version-provider.js';
import { piccoloreTextStyler } from '../../cli/infra/piccolore-text-styler.js';
async function createStaticPreviewServer(settings, logger) {
	const startServerTime = performance.now();
	let previewServer;
	try {
		const astroPreviewConfig = {
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
		const { plugins: _plugins, ...userViteConfig } = settings.config.vite ?? {};
		const mergedViteConfig = mergeConfig(userViteConfig, astroPreviewConfig);
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
	const customShortcuts = [
		// Disable default Vite shortcuts that don't work well with Astro
		{ key: 'r', description: '' },
		{ key: 'u', description: '' },
		{ key: 'c', description: '' },
		{ key: 's', description: '' },
	];
	previewServer.bindCLIShortcuts({
		customShortcuts,
	});
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
	function closed() {
		return new Promise((resolve, reject) => {
			previewServer.httpServer.addListener('close', resolve);
			previewServer.httpServer.addListener('error', reject);
		});
	}
	const address = previewServer.httpServer.address();
	const actualPort =
		address && typeof address === 'object' ? address.port : settings.config.server.port;
	return {
		host: getResolvedHostForHttpServer(settings.config.server.host),
		port: actualPort,
		closed,
		server: previewServer.httpServer,
		stop: previewServer.close.bind(previewServer),
	};
}
export { createStaticPreviewServer as default };
