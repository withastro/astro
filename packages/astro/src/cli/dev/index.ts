import fs from 'fs';
import type yargs from 'yargs-parser';
import { resolveConfigPath, resolveFlags } from '../../core/config/index.js';
import devServer from '../../core/dev/index.js';
import { info, type LogOptions } from '../../core/logger/core.js';
import { handleConfigError, loadSettings } from '../load-settings.js';

interface DevOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function dev({ flags, logging }: DevOptions) {
	const settings = await loadSettings({ cmd: 'dev', flags, logging });
	if (!settings) return;

	const root = flags.root;
	const configFlag = resolveFlags(flags).config;
	const configFlagPath = configFlag ? await resolveConfigPath({ cwd: root, flags, fs }) : undefined;

	return await devServer(settings, {
		configFlag,
		configFlagPath,
		flags,
		logging,
		handleConfigError(e) {
			handleConfigError(e, { cmd: 'dev', cwd: root, flags, logging });
			info(logging, 'astro', 'Continuing with previous valid configuration\n');
		},
	});
}
