import prompts from 'prompts';
import type { Prompt } from '../definitions.js';

interface Options {
	force: boolean;
}

export function createPromptsPrompt({ force }: Options): Prompt {
	return {
		async confirm({ message, defaultValue }) {
			if (force) {
				return true;
			}
			const { value } = await prompts({
				type: 'confirm',
				name: 'value',
				message,
				initial: defaultValue,
			});
			return value;
		},
	};
}
