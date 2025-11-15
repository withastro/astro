// @ts-check

/** @returns {import("../../../dist/cli/definitions.js").CommandRunner} */
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
	/** @type {Array<import('../../../dist/cli/domain/help-payload.js').HelpPayload>} */
	const payloads = [];

	/** @type {import("../../../dist/cli/definitions.js").HelpDisplay} */
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

/**
 * @param {string} version
 * @returns {import("../../../dist/cli/definitions.js").AstroVersionProvider}
 * */
export function createFakeAstroVersionProvider(version) {
	return {
		getVersion() {
			return version;
		},
	};
}

/**
 * @param {import('../../../dist/cli/docs/domain/cloud-ide.js').CloudIde | null} cloudIde
 * @returns {import("../../../dist/cli/docs/definitions.js").CloudIdeProvider}
 * */
export function createFakeCloudIdeProvider(cloudIde) {
	return {
		getName() {
			return cloudIde;
		},
	};
}

/**
 * @param {NodeJS.Platform} platform
 * @returns {import("../../../dist/cli/definitions.js").OperatingSystemProvider}
 */
export function createFakeOperatingSystemProvider(platform) {
	return {
		getName() {
			return platform;
		},
		getDisplayName() {
			return platform;
		},
	};
}

export function createSpyCommandExecutor() {
	/** @type {Array<{ command: string; args?: Array<string> }>} */
	const inputs = [];

	/** @type {import("../../../dist/cli/definitions.js").CommandExecutor} */
	const commandExecutor = {
		async execute(command, args) {
			inputs.push({ command, args });
			return {
				stdout: '',
			};
		},
	};

	return { inputs, commandExecutor };
}
