import type { AstroLogger } from '../../../core/logger/core.js';
import type { Clipboard, Prompt } from '../definitions.js';
import { writeText } from 'tinyclip';

export class TinyclipClipboard implements Clipboard {
	readonly #logger: AstroLogger;
	readonly #prompt: Prompt;

	constructor({
		logger,
		prompt,
	}: {
		logger: AstroLogger;
		prompt: Prompt;
	}) {
		this.#logger = logger;
		this.#prompt = prompt;
	}

	async copy(text: string): Promise<void> {
		if (
			!(await this.#prompt.confirm({
				message: 'Copy to clipboard?',
				defaultValue: true,
			}))
		) {
			return;
		}

		try {
			await writeText(text.trim());
			this.#logger.info('SKIP_FORMAT', 'Copied to clipboard!');
		} catch {
			this.#logger.error(
				'SKIP_FORMAT',
				'Sorry, something went wrong! Please copy the text above manually.',
			);
		}
	}
}
