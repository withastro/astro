import type { LogOptions } from '../core/logger/core';
import type { UserConfig as VitestConfig } from 'vitest/config';

import * as vite from 'vite';
import * as vitest from 'vitest';
import { nodeLogDestination } from '../core/logger/node.js';
import { openConfig } from '../core/config.js';
import { createVite } from '../core/create-vite.js';
import { runHookConfigDone, runHookConfigSetup } from '../integrations/index.js';

export async function getViteConfig(): Promise<vite.UserConfig> {
	let logging: LogOptions = {
		dest: nodeLogDestination,
		level: 'info',
	};
	let { astroConfig: config } = await openConfig({
		cmd: 'test',
		logging,
	});
	await runHookConfigSetup({ config, command: 'dev' });
	const viteConfig = await createVite(
		{
			mode: 'test',
		},
		{ astroConfig: config, logging: logging, mode: 'dev' }
	);
	await runHookConfigDone({ config });
	return viteConfig;
}

export async function getVitestConfig(test: vitest.UserConfig = {}): Promise<VitestConfig> {
	const viteConfig = await getViteConfig();
	return Object.assign(viteConfig, { test });
}
