// @ts-check

/**
 * @import { CommandRunner, HelpDisplay, AstroVersionProvider, OperatingSystemProvider, CommandExecutor, CommandExecutorOptions } from "../../../dist/cli/definitions.js"
 * @import { AnyCommand } from "../../../dist/cli/domain/command.js"
 * @import { KeyGenerator } from "../../../dist/cli/create-key/definitions.js"
 * @import { HelpPayload } from "../../../dist/cli/domain/help-payload.js"
 * @import { CloudIdeProvider } from "../../../dist/cli/docs/definitions.js"
 * @import { CloudIde } from "../../../dist/cli/docs/domain/cloud-ide.js"
 * @import { DebugInfoProvider, Clipboard, PackageManagerUserAgentProvider, Prompt, NodeVersionProvider } from "../../../dist/cli/info/definitions.js"
 * @import { DebugInfo } from "../../../dist/cli/info/domain/debug-info.js"
 */

/** @implements {CommandRunner} */
export class PassthroughCommandRunner {
	/**
	 * @template {AnyCommand} T
	 * @param {T} command
	 * @param  {Parameters<T['run']>} args
	 */
	run(command, ...args) {
		return command.run(...args);
	}
}

/** @implements {KeyGenerator} */
export class FakeKeyGenerator {
	/** @type {string} */
	#key;

	/**
	 * @param {string} key
	 */
	constructor(key) {
		this.#key = key;
	}

	async generate() {
		return this.#key;
	}
}

/** @implements {HelpDisplay} */
export class SpyHelpDisplay {
	/** @type {boolean} */
	#shouldFire;
	/** @type {Array<HelpPayload>} */
	#payloads = [];

	/**
	 * @param {boolean} shouldFire
	 */
	constructor(shouldFire) {
		this.#shouldFire = shouldFire;
	}

	shouldFire() {
		return this.#shouldFire;
	}

	/**
	 * @param {HelpPayload} payload
	 */
	show(payload) {
		this.#payloads.push(payload);
	}

	get payloads() {
		return this.#payloads;
	}
}

/** @implements {AstroVersionProvider} */
export class FakeAstroVersionProvider {
	/** @type {string} */
	#version;

	/**
	 * @param {string} version
	 */
	constructor(version) {
		this.#version = version;
	}

	get version() {
		return this.#version;
	}
}

/** @implements {CloudIdeProvider} */
export class FakeCloudIdeProvider {
	/** @type {CloudIde | null} */
	#name;

	/**
	 * @param {CloudIde | null} name
	 */
	constructor(name) {
		this.#name = name;
	}

	get name() {
		return this.#name;
	}
}

/** @implements {OperatingSystemProvider} */
export class FakeOperatingSystemProvider {
	/** @type {NodeJS.Platform} */
	#name;

	/**
	 * @param {NodeJS.Platform} name
	 */
	constructor(name) {
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	get displayName() {
		return this.#name;
	}
}

/** @implements {CommandExecutor} */
export class SpyCommandExecutor {
	/** @type {Array<{ command: string; args: Array<string> | undefined; input: string | undefined }>} */
	#inputs = [];
	/** @type {boolean} */
	#fail;

	/**
	 *
	 * @param {object} options
	 * @param {boolean} [options.fail=false] Forces execute() to throw an error. This is useful to test error handling
	 */
	constructor({ fail = false } = {}) {
		this.#fail = fail;
	}

	/**
	 *
	 * @param {string} command
	 * @param {Array<string> | undefined} args
	 * @param {CommandExecutorOptions | undefined} options
	 * @returns
	 */
	async execute(command, args, options) {
		this.#inputs.push({ command, args, input: options?.input });
		if (this.#fail) {
			throw new Error('Command execution failed');
		}
		return {
			stdout: '',
		};
	}

	get inputs() {
		return this.#inputs;
	}
}

/** @implements {DebugInfoProvider} */
export class FakeDebugInfoProvider {
	/** @type {DebugInfo} */
	#debugInfo;

	/**
	 * @param {DebugInfo} debugInfo
	 */
	constructor(debugInfo) {
		this.#debugInfo = debugInfo;
	}

	async get() {
		return this.#debugInfo;
	}
}

/** @implements {Clipboard} */
export class SpyClipboard {
	/** @type {Array<string>} */
	#texts = [];

	/**
	 * @param {string} text
	 */
	async copy(text) {
		this.#texts.push(text);
	}

	get texts() {
		return this.#texts;
	}
}

/** @implements {PackageManagerUserAgentProvider} */
export class FakePackageManagerUserAgentProvider {
	/** @type {string | null} */
	#userAgent;

	/**
	 * @param {string | null} userAgent
	 */
	constructor(userAgent) {
		this.#userAgent = userAgent;
	}

	get userAgent() {
		return this.#userAgent;
	}
}

/** @implements {Prompt} */
export class FakePrompt {
	/** @type {boolean} */
	#confirmed;

	/**
	 * @param {boolean} confirmed
	 */
	constructor(confirmed) {
		this.#confirmed = confirmed;
	}

	async confirm() {
		return this.#confirmed;
	}
}

/** @implements {NodeVersionProvider} */
export class FakeNodeVersionProvider {
	/** @type {string} */
	#version;

	/**
	 * @param {`v${string}`} version
	 */
	constructor(version) {
		this.#version = version;
	}

	get version() {
		return this.#version;
	}
}
