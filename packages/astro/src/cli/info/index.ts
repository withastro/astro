/* eslint-disable no-console */
import { arch, platform } from 'node:os';
import * as colors from 'kleur/colors';
import whichPm from 'which-pm';
import type yargs from 'yargs-parser';
import { openConfig } from '../../core/config/index.js';
import { ASTRO_VERSION } from '../../core/constants.js';
import type { LogOptions } from '../../core/logger/core.js';

export async function printInfo({
	cwd,
	flags,
	logging,
}: {
	cwd?: string;
	flags?: yargs.Arguments;
	logging: LogOptions;
}) {
	const packageManager = await whichPm(process.cwd());
	let adapter = "Couldn't determine.";
	let integrations = [];

	const MAX_PADDING = 25;
	function printRow(label: string, value: string) {
		const padding = MAX_PADDING - label.length;
		console.log(`${colors.bold(label)}` + ' '.repeat(padding) + `${colors.green(value)}`);
	}

	try {
		const { userConfig } = await openConfig({
			cwd,
			flags,
			cmd: 'info',
			logging,
		});
		if (userConfig.adapter?.name) {
			adapter = userConfig.adapter.name;
		}
		if (userConfig.integrations) {
			integrations = (userConfig?.integrations ?? [])
				.filter(Boolean)
				.flat()
				.map((i: any) => i?.name);
		}
	} catch (_e) {}
	console.log();
	const packageManagerName = packageManager?.name ?? "Couldn't determine.";
	printRow('Astro version', `v${ASTRO_VERSION}`);
	printRow('Package manager', packageManagerName);
	printRow('Platform', platform());
	printRow('Architecture', arch());
	printRow('Adapter', adapter);
	let integrationsString = "None or couldn't determine.";
	if (integrations.length > 0) {
		integrationsString = integrations.join(', ');
	}
	printRow('Integrations', integrationsString);
}
