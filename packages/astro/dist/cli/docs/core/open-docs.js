import { defineCommand } from '../../domain/command.js';
function getExecInputForPlatform(platform) {
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
const openDocsCommand = defineCommand({
	help: {
		commandName: 'astro docs',
		tables: {
			Flags: [['--help (-h)', 'See all available flags.']],
		},
		description: `Launches the Astro Docs website directly from the terminal.`,
	},
	async run({ url, operatingSystemProvider, logger, commandExecutor, cloudIdeProvider }) {
		const platform = cloudIdeProvider.name ?? operatingSystemProvider.name;
		const input = getExecInputForPlatform(platform);
		if (!input) {
			logger.error(
				'SKIP_FORMAT',
				`It looks like your platform ("${platform}") isn't supported!
To view Astro's docs, please visit ${url}`,
			);
			return;
		}
		const [command, args = []] = input;
		await commandExecutor.execute(command, [...args, encodeURI(url)]);
	},
});
export { openDocsCommand };
