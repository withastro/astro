import type { HelpPayload } from './help-payload.js';
interface Command<T extends (...args: Array<any>) => any> {
	help: HelpPayload;
	run: T;
}
export type AnyCommand = Command<(...args: Array<any>) => any>;
export declare function defineCommand<T extends AnyCommand>(command: T): T;
export {};
