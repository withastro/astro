import type { CommandRunner, HelpDisplay } from '../definitions.js';

interface Options {
	helpDisplay: HelpDisplay;
}

export function createCliCommandRunner({ helpDisplay }: Options): CommandRunner {
	return {
		run(command, ...args) {
			if (helpDisplay.shouldFire()) {
				helpDisplay.show(command.help);
				return;
			}
			return command.run(...args);
		},
	};
}
