import type { Logger } from '../../../core/logger/core.js';
import { defineCommand } from '../../domain/command.js';
import { INTEGRATION_CATEGORY_LABELS } from '../constants.js';
import type { Integration } from '../domain/integration.js';

interface Options {
	officialIntegrations: Array<Integration>;
	names: Array<string>;
	config: {
		publicDir: string;
		srcDir: string;
		root: URL;
	};
	rawConfigPath: string | undefined;
	logger: Logger;
}

// extract
function validateIntegrations({
	officialIntegrations,
	names,
}: Pick<Options, 'officialIntegrations' | 'names'>): Array<Integration> {
	for (const name of names) {
		const officialIntegration = officialIntegrations.find(
			(e) => e.name === name || e.aliases?.includes(name),
		);
		if (officialIntegration) {
            // TODO:
        } else {
            // TODO:
		}
	}
}

export const addCommand = defineCommand({
	async run({ officialIntegrations, names }: Options) {
		// TODO: validate integrations
		// TODO: install integrations
		// TODO: scaffold files
	},
	showHelp({ names }) {
		return names.length === 0;
	},
	help({ officialIntegrations }) {
		// TODO: extact to testable function
		const table: Record<string, [command: string, help: string][]> = {};
		for (const integration of officialIntegrations) {
			const label = INTEGRATION_CATEGORY_LABELS[integration.category];
			table[label] ??= [];
			table[label].push([integration.name, `astro add ${integration.name}`]);
		}
		return {
			commandName: 'astro add',
			usage: '[...integrations] [...adapters]',
			tables: {
				Flags: [
					['--yes', 'Accept all prompts.'],
					['--help', 'Show this help message.'],
				],
				...table,
			},
			description: 'For more integrations, check out: https://astro.build/integrations',
		};
	},
});
