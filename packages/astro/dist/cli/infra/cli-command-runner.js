class CliCommandRunner {
	#helpDisplay;
	constructor({ helpDisplay }) {
		this.#helpDisplay = helpDisplay;
	}
	run(command, ...args) {
		if (this.#helpDisplay.shouldFire()) {
			this.#helpDisplay.show(command.help);
			return;
		}
		return command.run(...args);
	}
}
export { CliCommandRunner };
