import prompts from 'prompts';
import type { Prompt } from '../definitions.js';

export class PromptsPrompt implements Prompt {
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
		const { value } = await prompts({
			type: 'confirm',
			name: 'value',
			message,
			initial: defaultValue,
		});
		return value;
	}
}
