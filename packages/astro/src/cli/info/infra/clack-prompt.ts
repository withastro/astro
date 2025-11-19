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
			return await confirm({
				message,
				initial: defaultValue,
			});
		},
	};
}
