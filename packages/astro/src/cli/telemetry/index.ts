/* eslint-disable no-console */
import type yargs from 'yargs-parser';
import * as msg from '../../core/messages.js';
import { telemetry } from '../../events/index.js';
import whichPm from 'which-pm';

interface TelemetryOptions {
	flags: yargs.Arguments;
}


export async function notify() {
	const packageManager = (await whichPm(process.cwd())).name ?? 'npm';
	await telemetry.notify(() => {
		console.log(msg.telemetryNotice(packageManager) + '\n');
		return true;
	});
}

export async function update(subcommand: string, { flags }: TelemetryOptions) {
	const isValid = ['enable', 'disable', 'reset'].includes(subcommand);

	if (flags.help || flags.h || !isValid) {
		msg.printHelp({
			commandName: 'astro telemetry',
			usage: '[command]',
			tables: {
				Commands: [
					['enable', 'Enable anonymous data collection.'],
					['disable', 'Disable anonymous data collection.'],
					['reset', 'Reset anonymous data collection settings.'],
				],
			},
		});
		return;
	}

	switch (subcommand) {
		case 'enable': {
			telemetry.setEnabled(true);
			console.log(msg.telemetryEnabled());
			return;
		}
		case 'disable': {
			telemetry.setEnabled(false);
			console.log(msg.telemetryDisabled());
			return;
		}
		case 'reset': {
			telemetry.clear();
			console.log(msg.telemetryReset());
			return;
		}
	}
}
