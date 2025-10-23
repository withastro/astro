import type { Logger } from '../../../core/logger/core.js';
import { defineCommand } from '../../domain/command.js';
import type { CommandExecutor, PlatformProvider } from '../definitions.js';
import type { Platform } from '../domains/platform.js';

interface Options {
	url: string;
	platformProvider: PlatformProvider;
	logger: Logger;
	commandExecutor: CommandExecutor;
}

function getExecInputForPlatform(
	platform: Platform,
): [command: string, args?: Array<string>] | null {
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
		case 'aix':
		case 'freebsd':
		case 'haiku':
		case 'openbsd':
		case 'sunos':
		case 'cygwin':
		case 'netbsd':
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
	async run({ url, platformProvider, logger, commandExecutor }: Options) {
		const platform = platformProvider.get();
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
