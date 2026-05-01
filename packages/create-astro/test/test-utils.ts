import { before, beforeEach } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { setStdout } from '../dist/index.js';
import type { Context } from '../src/actions/context.ts';
import type {
	dependencies,
	git,
	intro,
	next,
	projectName,
	template,
	verify,
} from '../dist/index.js';

export type { Context };
export type DependenciesContext = Parameters<typeof dependencies>[0];
export type GitContext = Parameters<typeof git>[0];
export type IntroContext = Parameters<typeof intro>[0];
export type NextContext = Parameters<typeof next>[0];
export type ProjectNameContext = Parameters<typeof projectName>[0];
export type TemplateContext = Parameters<typeof template>[0];
export type VerifyContext = Parameters<typeof verify>[0];

export function mockPrompt(answers: Record<string, unknown>): Context['prompt'] {
	const fn = async (q: { name: string }) => {
		return { [q.name]: answers[q.name] };
	};
	return fn as unknown as Context['prompt'];
}

export const mockExit: Context['exit'] = (code) => {
	throw code;
};

export function setup() {
	const ctx: { messages: string[] } = { messages: [] };
	before(() => {
		setStdout(
			Object.assign({}, process.stdout, {
				write(buf: Uint8Array | string) {
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
