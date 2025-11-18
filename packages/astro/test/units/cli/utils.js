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

export function createSpyCommandExecutor({ fail = false } = {}) {
	/** @type {Array<{ command: string; args: Array<string> | undefined; input: string | undefined }>} */
	const inputs = [];

	/** @type {import("../../../dist/cli/definitions.js").CommandExecutor} */
	const commandExecutor = {
		async execute(command, args, options) {
			inputs.push({ command, args, input: options?.input });
			if (fail) {
				throw new Error('Command execution failed');
			}
			return {
				stdout: '',
			};
		},
	};

	return { inputs, commandExecutor };
}

/**
 * @param {import("../../../dist/cli/info/domain/debug-info.js").DebugInfo} debugInfo
 * @returns {import("../../../dist/cli/info/definitions.js").DebugInfoProvider}
 */
export function createFakeDebugInfoProvider(debugInfo) {
	return {
		async get() {
			return debugInfo;
		},
	};
}

export function createSpyClipboard() {
	/** @type {Array<string>} */
	const texts = [];

	/** @type {import("../../../dist/cli/info/definitions.js").Clipboard} */
	const clipboard = {
		async copy(text) {
			texts.push(text);
		},
	};

	return { texts, clipboard };
}

/**
 * @param {string | null} userAgent
 * @returns {import("../../../dist/cli/info/definitions.js").PackageManagerUserAgentProvider}
 */
export function createFakePackageManagerUserAgentProvider(userAgent) {
	return {
		getUserAgent() {
			return userAgent;
		},
	};
}

/**
 * @param {boolean} confirmed
 * @returns {import("../../../dist/cli/info/definitions.js").Prompt}
 * */
export function createFakePrompt(confirmed) {
	return {
		async confirm() {
			return confirmed;
		},
	};
}

/**
 *
 * @param {`v${string}`} version
 * @returns {import("../../../dist/cli/info/definitions.js").NodeVersionProvider}
 */
export function createFakeNodeVersionProvider(version) {
	return {
		get() {
			return version;
		},
	};
}
