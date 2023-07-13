import type yargs from 'yargs-parser';
import type { LogOptions } from '../../core/logger/core.js';
import previewServer from '../../core/preview/index.js';
import { loadSettings } from '../load-settings.js';

interface PreviewOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function preview({ flags, logging }: PreviewOptions) {
	const settings = await loadSettings({ cmd: 'preview', flags, logging });
	if (!settings) return;

	return await previewServer(settings, { flags, logging });
}
