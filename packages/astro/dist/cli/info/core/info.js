import { defineCommand } from '../../domain/command.js';
const infoCommand = defineCommand({
	help: {
		commandName: 'astro info',
		tables: {
			Flags: [
				['--help (-h)', 'See all available flags.'],
				['--copy', 'Force copy of the output.'],
			],
		},
		description:
			'Reports useful information about your current Astro environment. Useful for providing information when opening an issue.',
	},
	async run({ debugInfoProvider, getDebugInfoFormatter, logger, clipboard }) {
		const debugInfo = await debugInfoProvider.get();
		logger.info('SKIP_FORMAT', getDebugInfoFormatter({ pretty: true }).format(debugInfo));
		await clipboard.copy(getDebugInfoFormatter({ pretty: false }).format(debugInfo));
	},
});
export { infoCommand };
