import type { HelpPayload } from './help-payload.js';

export interface Command<T extends (...args: Array<any>) => any> {
	run: T;
	help: HelpPayload | ((...args: Parameters<T>) => HelpPayload);
	showHelp?: (...args: Parameters<T>) => boolean;
}

export type AnyCommand = Command<(...args: Array<any>) => any>;

export function defineCommand<T extends (...args: Array<any>) => any>(command: Command<T>) {
	return command;
}
