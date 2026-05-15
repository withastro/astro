import { writeText } from 'tinyclip';
class TinyclipClipboard {
	#logger;
	#prompt;
	constructor({ logger, prompt }) {
		this.#logger = logger;
		this.#prompt = prompt;
	}
	async copy(text) {
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
export { TinyclipClipboard };
