import { before, beforeEach } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { setStdout } from '../dist/index.js';

export type ShellFunction = (
	command: string,
	flags: string[],
) => Promise<{
	stdout: string;
	stderr: string;
	exitCode: number;
}>;

export function setup() {
	const ctx: { messages: string[] } = { messages: [] };
	before(() => {
		setStdout(
			Object.assign({}, process.stdout, {
				write(buf: string | Uint8Array) {
					ctx.messages.push(stripVTControlCharacters(String(buf)).trim());
					return true;
				},
			}),
		);
	});
	beforeEach(() => {
		ctx.messages = [];
	});

	return {
		messages() {
			return ctx.messages;
		},
		length() {
			return ctx.messages.length;
		},
		hasMessage(content: string) {
			return !!ctx.messages.find((msg) => msg.includes(content));
		},
	};
}
