import type { AstroTelemetry } from '@astrojs/telemetry';
import { execa } from 'execa';
import type { AstroSettings } from '../../@types/astro';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/index.js';
import type { LogOptions } from '../logger/core';
import createStaticPreviewServer from './static-preview-server.js';
import { createRequire } from 'module';
import { getResolvedHostForHttpServer } from './util.js';

interface PreviewOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

/** The primary dev action */
export default async function preview(
	_settings: AstroSettings,
	{ logging }: PreviewOptions
): Promise<any> {
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
		return server.closed();
	}
	if (!settings.adapter) {
		throw new Error(`[preview] No adapter found.`);
	}
	if (!settings.adapter.previewEntrypoint) {
		throw new Error(`[preview] adapter does not have previewEntrypoint.`);
	}
	// We need to use require.resolve() here so that advanced package managers like pnpm
	// don't treat this as a dependency of Astro itself. This correctly resolves the
	// preview entrypoint of the integration package, relative to the user's project root.
	const require = createRequire(settings.config.root);
	const previewEntrypoint = require.resolve(settings.adapter.previewEntrypoint);
	const previewModule = await import(previewEntrypoint);
	return previewModule.default({ outDir: settings.config.outDir, host, port });
}
