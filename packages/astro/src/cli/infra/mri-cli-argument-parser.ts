import mri from 'mri';
import type { CliArgumentParser } from '../definitions.js';
import type { Flags } from '../flags.js';

function camelCase(option: string): string {
	return option.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function normalizeNegativePortArguments(args: string[]): string[] {
	const normalized: string[] = [];
	for (let index = 0; index < args.length; index++) {
		if (args[index] === '--') {
			normalized.push(...args.slice(index));
			break;
		}
		if (args[index] === '--port' && /^-\d/.test(args[index + 1] ?? '')) {
			normalized.push(`--port=${args[++index]}`);
		} else {
			normalized.push(args[index]);
		}
	}
	return normalized;
}

export class MriCliArgumentParser implements CliArgumentParser {
	parse(args: string[]): Flags {
		const parsed = mri(normalizeNegativePortArguments(args), {
			boolean: ['global'],
			alias: { g: 'global' },
		});
		const flags: Flags = { _: parsed._ };

		for (const [option, value] of Object.entries(parsed)) {
			if (option !== '_') flags[camelCase(option)] = value;
		}

		return flags;
	}
}
