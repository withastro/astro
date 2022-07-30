import type { AstroTelemetry } from '@astrojs/telemetry';
import { execa } from 'execa';
import type { AstroConfig } from '../../@types/astro';
import type { LogOptions } from '../logger/core';
import createStaticPreviewServer from './static-preview-server.js';

interface PreviewOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

/** The primary dev action */
export default async function preview(
	config: AstroConfig,
	{ logging }: PreviewOptions
): Promise<any> {
	if (!config._ctx.adapter) {
		const server = await createStaticPreviewServer(config, { logging });
		return server.closed(); 
	}
	const [previewCommand, ...previewArgs] = config._ctx.adapter.previewCommand || [];
	if (!previewCommand) {
		throw new Error('No preview command found for adapter');
	}
	console.log('GO', previewCommand, previewArgs);
	return execa(previewCommand, previewArgs, { cwd: config.root, stdio: 'inherit' });
}
