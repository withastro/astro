/* eslint-disable no-console */
import * as colors from 'kleur/colors';
import { arch, platform } from 'node:os';
import whichPm from 'which-pm';
import type yargs from 'yargs-parser';
import { openConfig } from '../../core/config/index.js';
import { ASTRO_VERSION } from '../../core/constants.js';

interface InfoOptions {
	flags: yargs.Arguments;
}

export async function printInfo({ flags }: InfoOptions) {
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
			cwd: flags.root,
			flags,
			cmd: 'info',
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
