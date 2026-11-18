import { confirm } from '@clack/prompts';
import type { Prompt } from '../definitions.js';

export class ClackPrompt implements Prompt {
	readonly #force: boolean;

	constructor({ force }: { force: boolean }) {
		this.#force = force;
	}

	async confirm({
		message,
		defaultValue,
	}: {
		message: string;
		defaultValue?: boolean;
	}): Promise<boolean> {
		if (this.#force) {
			return true;
		}
		const response = await confirm({
			message,
			initialValue: defaultValue,
			withGuide: false,
		});
		// Response is a symbol when cancelled
		return response === true;
	}
}
