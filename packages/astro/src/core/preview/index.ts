import type { AstroTelemetry } from '@astrojs/telemetry';
import { createRequire } from 'module';
import type { AstroSettings, PreviewModule, PreviewServer } from '../../@types/astro';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/index.js';
import type { LogOptions } from '../logger/core';
import createStaticPreviewServer from './static-preview-server.js';
import { getResolvedHostForHttpServer } from './util.js';

interface PreviewOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

/** The primary dev action */
export default async function preview(
	_settings: AstroSettings,
	{ logging }: PreviewOptions
): Promise<PreviewServer> {
	const settings = await runHookConfigSetup({
		settings: _settings,
		command: 'preview',
		logging: logging,
	});
	await runHookConfigDone({ settings: settings, logging: logging });
	const host = getResolvedHostForHttpServer(settings.config.server.host);
	const { port } = settings.config.server;

	if (settings.config.output === 'static') {
		const server = await createStaticPreviewServer(settings, { logging, host, port });
		return server;
	}
	if (!settings.adapter) {
		throw new Error(`[preview] No adapter found.`);
	}
	if (!settings.adapter.previewEntrypoint) {
		throw new Error(
			`[preview] The ${settings.adapter.name} adapter does not support the preview command.`
		);
	}
	// We need to use require.resolve() here so that advanced package managers like pnpm
	// don't treat this as a dependency of Astro itself. This correctly resolves the
	// preview entrypoint of the integration package, relative to the user's project root.
	const require = createRequire(settings.config.root);
	const previewEntrypoint = require.resolve(settings.adapter.previewEntrypoint);

	const previewModule = (await import(previewEntrypoint)) as Partial<PreviewModule>;
	if (typeof previewModule.default !== 'function') {
		throw new Error(`[preview] ${settings.adapter.name} cannot preview your app.`);
	}

	const server = await previewModule.default({
		outDir: settings.config.outDir,
		client: settings.config.build.client,
		serverEntrypoint: new URL(settings.config.build.serverEntry, settings.config.build.server),
		host,
		port,
		base: settings.config.base,
	});

	return server;
}
