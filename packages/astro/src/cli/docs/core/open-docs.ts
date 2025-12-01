import type { Logger } from '../../../core/logger/core.js';
import type { CommandExecutor, OperatingSystemProvider } from '../../definitions.js';
import { defineCommand } from '../../domain/command.js';
import type { CloudIdeProvider } from '../definitions.js';

interface Options {
	url: string;
	operatingSystemProvider: OperatingSystemProvider;
	logger: Logger;
	commandExecutor: CommandExecutor;
	cloudIdeProvider: CloudIdeProvider;
}

function getExecInputForPlatform(platform: string): [command: string, args?: Array<string>] | null {
	switch (platform) {
		case 'android':
		case 'linux':
			return ['xdg-open'];
		case 'darwin':
			return ['open'];
		case 'win32':
			return ['cmd', ['/c', 'start']];
		case 'gitpod':
			return ['/ide/bin/remote-cli/gitpod-code', ['--openExternal']];
		default:
			return null;
	}
}

export const openDocsCommand = defineCommand({
	help: {
		commandName: 'astro docs',
		tables: {
			Flags: [['--help (-h)', 'See all available flags.']],
		},
		description: `Launches the Astro Docs website directly from the terminal.`,
	},
	async run({ url, operatingSystemProvider, logger, commandExecutor, cloudIdeProvider }: Options) {
		const platform = cloudIdeProvider.name ?? operatingSystemProvider.name;
		const input = getExecInputForPlatform(platform);
		if (!input) {
			logger.error(
				'SKIP_FORMAT',
				`It looks like your platform ("${platform}") isn't supported!\nTo view Astro's docs, please visit ${url}`,
			);
			return;
		}
		const [command, args = []] = input;
		await commandExecutor.execute(command, [...args, encodeURI(url)]);
	},
});
