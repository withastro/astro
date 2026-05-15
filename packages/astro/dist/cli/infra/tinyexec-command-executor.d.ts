import type { CommandExecutor, CommandExecutorOptions } from '../definitions.js';
export declare class TinyexecCommandExecutor implements CommandExecutor {
	execute(
		command: string,
		args?: Array<string>,
		options?: CommandExecutorOptions,
	): Promise<{
		stdout: string;
	}>;
}
