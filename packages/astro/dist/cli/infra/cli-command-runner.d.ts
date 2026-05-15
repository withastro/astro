import type { CommandRunner, HelpDisplay } from '../definitions.js';
import type { AnyCommand } from '../domain/command.js';
export declare class CliCommandRunner implements CommandRunner {
	#private;
	constructor({ helpDisplay }: { helpDisplay: HelpDisplay });
	run<T extends AnyCommand>(
		command: T,
		...args: Parameters<T['run']>
	): ReturnType<T['run']> | undefined;
}
