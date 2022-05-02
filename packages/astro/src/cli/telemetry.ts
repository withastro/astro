/* eslint-disable no-console */
import type yargs from 'yargs-parser';
import type { AstroTelemetry } from '@astrojs/telemetry';

import prompts from 'prompts';
import * as msg from '../core/messages.js';

export interface TelemetryOptions {
	flags: yargs.Arguments;
	telemetry: AstroTelemetry;
}

export async function update(subcommand: string, { flags, telemetry }: TelemetryOptions) {
	const isValid = ['enable', 'disable', 'reset'].includes(subcommand);

	if (flags.help || !isValid) {
		msg.printHelp({
			commandName: 'astro telemetry',
			usage: '<enable|disable|reset>',
			commands: [
				['enable', 'Enable anonymous data collection.'],
				['disable', 'Disable anonymous data collection.'],
				['reset', 'Reset anonymous data collection settings.'],
			],
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

export async function notify({ telemetry }: TelemetryOptions) {
	return telemetry.notify(async () => {
		console.clear();
		console.log(msg.telemetryNotice());
		console.log();
		const response = await prompts({
			type: 'select',
			name: 'accepted',
			message: `Opt-in to Astro\'s telemetry program?`,
			instructions: false,
			choices: [
				{ title: 'Yes', description: 'Share anonymous usage data to improve Astro', value: true },
				{ title: 'No', description: 'Do not share anonymous usage data', value: false },
			],
			initial: 0,
		});
		const enabled = response.accepted ?? false;
		console.clear();
		if (enabled) {
			console.log(msg.telemetryEnabled());
		} else {
			console.log(msg.telemetryDisabled());
		}
		return enabled;
	});
}
