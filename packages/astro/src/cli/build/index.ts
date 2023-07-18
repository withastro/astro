import type yargs from 'yargs-parser';
import _build from '../../core/build/index.js';
import type { LogOptions } from '../../core/logger/core.js';
import { loadSettings } from '../load-settings.js';

interface BuildOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function build({ flags, logging }: BuildOptions) {
	const settings = await loadSettings({ cmd: 'build', flags, logging });
	if (!settings) return;

	await _build(settings, {
		flags,
		logging,
		teardownCompiler: true,
		mode: flags.mode,
	});
}
