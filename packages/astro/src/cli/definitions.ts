import type { StdioOptions } from 'node:child_process';
import type { AnyCommand } from './domain/command.js';
import type { HelpPayload } from './domain/help-payload.js';

export interface HelpDisplay {
	shouldFire: () => boolean;
	show: (payload: HelpPayload) => void;
}

export interface TextStyler {
	bgWhite: (msg: string) => string;
	black: (msg: string) => string;
	dim: (msg: string) => string;
	green: (msg: string) => string;
	bold: (msg: string) => string;
	bgGreen: (msg: string) => string;
}

export interface AstroVersionProvider {
	readonly version: string;
}

export interface CommandRunner {
	run: <T extends AnyCommand>(
		command: T,
		...args: Parameters<T['run']>
	) => ReturnType<T['run']> | undefined;
}

export interface CommandExecutorOptions {
	cwd?: string;
	env?: Record<string, string | undefined>;
	shell?: boolean;
	input?: string;
	stdio?: StdioOptions;
}

export interface CommandExecutor {
	execute: (
		command: string,
		args?: Array<string>,
		options?: CommandExecutorOptions,
	) => Promise<{ stdout: string }>;
}

export interface OperatingSystemProvider {
	readonly name: NodeJS.Platform;
	readonly displayName: string;
}
