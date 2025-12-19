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
		if (this.#helpDisplay.shouldFire() || command.showHelp?.(...args)) {
			const help = typeof command.help === 'function' ? command.help(...args) : command.help;
			this.#helpDisplay.show(help);
			return;
		}
		return command.run(...args);
	}
}
