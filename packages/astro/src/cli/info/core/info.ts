import type { Logger } from '../../../core/logger/core.js';
import { defineCommand } from '../../domain/command.js';
import type { Clipboard, DebugInfoFormatter, DebugInfoProvider } from '../definitions.js';

interface Options {
	debugInfoProvider: DebugInfoProvider;
	debugInfoFormatter: DebugInfoFormatter;
	logger: Logger;
	clipboard: Clipboard;
}

export const infoCommand = defineCommand({
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
	async run({ debugInfoProvider, debugInfoFormatter, logger, clipboard }: Options) {
		const debugInfo = await debugInfoProvider.get();
		const output = debugInfoFormatter.format(debugInfo);
		logger.info('SKIP_FORMAT', output);
		// TODO: need other debug formatter
		await clipboard.copy(output);
	},
});
