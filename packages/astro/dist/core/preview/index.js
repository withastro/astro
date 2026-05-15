import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AstroIntegrationLogger } from '../logger/core.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/hooks.js';
import { resolveConfig } from '../config/config.js';
import { loadOrCreateNodeLogger } from '../logger/load.js';
import { createSettings } from '../config/settings.js';
import { createRoutesList } from '../routing/create-manifest.js';
import { getPrerenderDefault } from '../../prerender/utils.js';
import { ensureProcessNodeEnv } from '../util.js';
import createStaticPreviewServer from './static-preview-server.js';
import { getResolvedHostForHttpServer } from './util.js';
async function preview(inlineConfig) {
	ensureProcessNodeEnv('production');
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'preview');
	const logger = await loadOrCreateNodeLogger(astroConfig, inlineConfig ?? {});
	telemetry.record(eventCliSession('preview', userConfig));
	const _settings = await createSettings(
		astroConfig,
		inlineConfig.logLevel,
		fileURLToPath(astroConfig.root),
	);
	const settings = await runHookConfigSetup({
		settings: _settings,
		command: 'preview',
		logger,
	});
	await createRoutesList({ settings, cwd: inlineConfig.root }, logger);
	settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';
	await runHookConfigDone({ settings, logger, command: 'preview' });
	if (settings.buildOutput === 'static') {
		if (!fs.existsSync(settings.config.outDir)) {
			const outDirPath = fileURLToPath(settings.config.outDir);
			throw new Error(
				`[preview] The output directory ${outDirPath} does not exist. Did you run \`astro build\`?`,
			);
		}
		const server2 = await createStaticPreviewServer(settings, logger);
		return server2;
	}
	if (!settings.adapter) {
		throw new Error(`[preview] No adapter found.`);
	}
	if (!settings.adapter.previewEntrypoint) {
		throw new Error(
			`[preview] The ${settings.adapter.name} adapter does not support the preview command.`,
		);
	}
	const require2 = createRequire(settings.config.root);
	const previewEntrypointUrl = pathToFileURL(
		require2.resolve(settings.adapter.previewEntrypoint.toString()),
	).href;
	const previewModule = await import(previewEntrypointUrl);
	if (typeof previewModule.default !== 'function') {
		throw new Error(`[preview] ${settings.adapter.name} cannot preview your app.`);
	}
	const server = await previewModule.default({
		outDir: settings.config.outDir,
		client: settings.config.build.client,
		server: settings.config.build.server,
		serverEntrypoint: new URL(settings.config.build.serverEntry, settings.config.build.server),
		host: getResolvedHostForHttpServer(settings.config.server.host),
		port: settings.config.server.port,
		base: settings.config.base,
		logger: new AstroIntegrationLogger(logger.options, settings.adapter.name),
		headers: settings.config.server.headers,
		allowedHosts: settings.config.server.allowedHosts,
		root: settings.config.root,
	});
	return server;
}
export { preview as default };
