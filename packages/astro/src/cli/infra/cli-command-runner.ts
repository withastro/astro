import type { CommandRunner, HelpDisplay } from '../definitions.js';
import type { AnyCommand } from '../domain/command.js';

export class CliCommandRunner implements CommandRunner {
	readonly #helpDisplay: HelpDisplay;

	constructor({
		helpDisplay,
	}: {
		helpDisplay: HelpDisplay;
	}) {
		this.#helpDisplay = helpDisplay;
	}

	run<T extends AnyCommand>(
		command: T,
		...args: Parameters<T['run']>
	): ReturnType<T['run']> | undefined {
		if (this.#helpDisplay.shouldFire()) {
			this.#helpDisplay.show(command.help);
			return;
		}
		return command.run(...args);
	}
}
