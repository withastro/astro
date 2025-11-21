import { confirm } from '@clack/prompts';
import type { Prompt } from '../definitions.js';

interface Options {
	force: boolean;
}

export function createClackPrompt({ force }: Options): Prompt {
	return {
		async confirm({ message, defaultValue }) {
			if (force) {
				return true;
			}
			const response = await confirm({
				message,
				initialValue: defaultValue,
			});
			// Response is a symbol when cancelled
			return response === true;
		},
	};
}
