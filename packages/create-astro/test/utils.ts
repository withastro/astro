import { describe, test, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import stripAnsi from 'strip-ansi';

export function setup() {
	let ctx: { messages: string[] } = { messages: [] };
	beforeAll(() => {
		vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
			ctx.messages.push(stripAnsi(args.join('')).trim())
		});
		vi.spyOn(process.stdout, 'write').mockImplementation((...args: any[]) => {
			ctx.messages.push(stripAnsi(args.join('')).trim())
			return true;
		});
	});
	beforeEach(() => {
		ctx.messages = [];
	})
	afterAll(() => {
		vi.clearAllMocks();
	});

	return {
		messages() {
			return ctx.messages
		},
		length() {
			return ctx.messages.length
		},
		hasMessage(content: string) {
			return !!ctx.messages.find(msg => msg.includes(content))
		}
	};
}
