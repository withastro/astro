import type { Logger } from '../../../core/logger/core.js';
import type { CommandExecutor } from '../../docs/definitions.js';
import type { Clipboard, OperatingSystemProvider, Prompt } from '../definitions.js';

interface Options {
	operatingSystemProvider: OperatingSystemProvider;
	commandExecutor: CommandExecutor;
	logger: Logger;
	prompt: Prompt;
}

async function getExecInputForPlatform({
	platform,
	commandExecutor,
}: {
	commandExecutor: CommandExecutor;
	platform: NodeJS.Platform;
}): Promise<[command: string, args?: Array<string>] | null> {
	if (platform === 'darwin') {
		return ['pbcopy'];
	}
	if (platform === 'win32') {
		return ['clip'];
	}
	// Unix: check if a supported command is installed
	const unixCommands: Array<[string, Array<string>]> = [
		['xclip', ['-selection', 'clipboard', '-l', '1']],
		['wl-copy', []],
	];
	for (const [unixCommand, unixArgs] of unixCommands) {
		try {
			const { stdout } = await commandExecutor.execute('which', [unixCommand]);
			if (stdout.trim()) {
				return [unixCommand, unixArgs];
			}
		} catch {
			continue;
		}
	}
	return null;
}

export function createCliClipboard({
	operatingSystemProvider,
	commandExecutor,
	logger,
	prompt,
}: Options): Clipboard {
	return {
		async copy(text) {
			text = text.trim();
			const platform = operatingSystemProvider.getName();
			const input = await getExecInputForPlatform({ platform, commandExecutor });
			if (!input) {
				logger.error('SKIP_FORMAT', 'Clipboard command not found!');
				logger.info('SKIP_FORMAT', 'Please manually copy the text above.');
				return;
			}

			if (
				!(await prompt.confirm({
					message: 'Copy to clipboard?',
					defaultValue: true,
				}))
			) {
				return;
			}

			try {
				const [command, args] = input;
				await commandExecutor.execute(command, args, {
					input: text,
				});
				logger.info('SKIP_FORMAT', 'Copied to clipboard!');
			} catch {
				logger.error(
					'SKIP_FORMAT',
					'Sorry, something went wrong! Please copy the text above manually.',
				);
			}
		},
	};
}
