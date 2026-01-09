import type { Logger } from '../../../core/logger/core.js';
import type { CommandExecutor, OperatingSystemProvider } from '../../definitions.js';
import type { Clipboard, Prompt } from '../definitions.js';

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
		['xclip', ['-selection', 'clipboard']],
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

export class CliClipboard implements Clipboard {
	readonly #operatingSystemProvider: OperatingSystemProvider;
	readonly #commandExecutor: CommandExecutor;
	readonly #logger: Logger;
	readonly #prompt: Prompt;

	constructor({
		operatingSystemProvider,
		commandExecutor,
		logger,
		prompt,
	}: {
		operatingSystemProvider: OperatingSystemProvider;
		commandExecutor: CommandExecutor;
		logger: Logger;
		prompt: Prompt;
	}) {
		this.#operatingSystemProvider = operatingSystemProvider;
		this.#commandExecutor = commandExecutor;
		this.#logger = logger;
		this.#prompt = prompt;
	}

	async copy(text: string): Promise<void> {
		text = text.trim();
		const platform = this.#operatingSystemProvider.name;
		const input = await getExecInputForPlatform({
			platform,
			commandExecutor: this.#commandExecutor,
		});
		if (!input) {
			this.#logger.warn('SKIP_FORMAT', 'Clipboard command not found!');
			this.#logger.info('SKIP_FORMAT', 'Please manually copy the text above.');
			return;
		}

		if (
			!(await this.#prompt.confirm({
				message: 'Copy to clipboard?',
				defaultValue: true,
			}))
		) {
			return;
		}

		try {
			const [command, args] = input;
			await this.#commandExecutor.execute(command, args, {
				input: text,
				stdio: ['pipe', 'ignore', 'ignore'],
			});
			this.#logger.info('SKIP_FORMAT', 'Copied to clipboard!');
		} catch {
			this.#logger.error(
				'SKIP_FORMAT',
				'Sorry, something went wrong! Please copy the text above manually.',
			);
		}
	}
}
