import fs from 'node:fs';
import type yargs from 'yargs-parser';
import type { LogOptions } from '../../core/logger/core.js';
import { syncCli } from '../../core/sync/index.js';
import { loadSettings } from '../load-settings.js';

interface SyncOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function sync({ flags, logging }: SyncOptions) {
	const settings = await loadSettings({ cmd: 'sync', flags, logging });
	if (!settings) return;

	const exitCode = await syncCli(settings, { logging, fs, flags });
	return exitCode;
}
