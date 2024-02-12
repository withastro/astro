import { before, beforeEach } from 'node:test';
import stripAnsi from 'strip-ansi';
import { setStdout } from '../dist/index.js';

export function setup() {
	const ctx = { messages: [] };
	before(() => {
		setStdout(
			Object.assign({}, process.stdout, {
				write(buf) {
					ctx.messages.push(stripAnsi(String(buf)).trim());
					return true;
				},
			})
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
		hasMessage(content) {
			return !!ctx.messages.find((msg) => msg.includes(content));
		},
	};
}
