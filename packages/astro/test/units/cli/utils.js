// @ts-check

/** @returns {import("../../../dist/cli/create-key/definitions.js").CommandRunner} */
export function createPassthroughCommandRunner() {
	return {
		run(command, ...args) {
			return command.run(...args);
		},
	};
}

/**
 * @param {string} key
 * @returns {import("../../../dist/cli/create-key/definitions.js").KeyGenerator}
 * */
export function createFakeKeyGenerator(key) {
	return {
		async generate() {
			return key;
		},
	};
}

/**
 * @param {boolean} shouldFire
 */
export function createSpyHelpDisplay(shouldFire) {
	/** @type {Array<import('../../../dist/cli/create-key/domain/help-payload.js').HelpPayload>} */
	const payloads = [];

	/** @type {import("../../../dist/cli/create-key/definitions.js").HelpDisplay} */
	const helpDisplay = {
		shouldFire() {
			return shouldFire;
		},
		show(payload) {
			payloads.push(payload);
		},
	};

	return {
		payloads,
		helpDisplay,
	};
}

/** @returns {import("../../../dist/cli/create-key/definitions.js").TextStyler} */
export function createPassthroughTextStyler() {
	return {
		bgWhite: (msg) => msg,
		black: (msg) => msg,
		dim: (msg) => msg,
		green: (msg) => msg,
		bold: (msg) => msg,
		bgGreen: (msg) => msg,
	};
}

/**
 * @param {string} version
 * @returns {import("../../../dist/cli/create-key/definitions.js").AstroVersionProvider}
 * */
export function createFakeAstroVersionProvider(version) {
	return {
		getVersion() {
			return version;
		},
	};
}
