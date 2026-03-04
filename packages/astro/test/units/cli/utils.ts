import type {
	CommandRunner,
	HelpDisplay,
	AstroVersionProvider,
	OperatingSystemProvider,
	CommandExecutor,
	CommandExecutorOptions,
} from '../../../dist/cli/definitions.js';
import type { AnyCommand } from '../../../dist/cli/domain/command.js';
import type { KeyGenerator } from '../../../dist/cli/create-key/definitions.js';
import type { HelpPayload } from '../../../dist/cli/domain/help-payload.js';
import type { CloudIdeProvider } from '../../../dist/cli/docs/definitions.js';
import type { CloudIde } from '../../../dist/cli/docs/domain/cloud-ide.js';
import type {
	DebugInfoProvider,
	Clipboard,
	PackageManagerUserAgentProvider,
	Prompt,
	NodeVersionProvider,
} from '../../../dist/cli/info/definitions.js';
import type { DebugInfo } from '../../../dist/cli/info/domain/debug-info.js';

export class PassthroughCommandRunner implements CommandRunner {
	run<T extends AnyCommand>(command: T, ...args: Parameters<T['run']>) {
		return command.run(...args);
	}
}

export class FakeKeyGenerator implements KeyGenerator {
	#key: string;

	constructor(key: string) {
		this.#key = key;
	}

	async generate() {
		return this.#key;
	}
}

export class SpyHelpDisplay implements HelpDisplay {
	#shouldFire: boolean;
	#payloads: Array<HelpPayload> = [];

	constructor(shouldFire: boolean) {
		this.#shouldFire = shouldFire;
	}

	shouldFire() {
		return this.#shouldFire;
	}

	show(payload: HelpPayload) {
		this.#payloads.push(payload);
	}

	get payloads() {
		return this.#payloads;
	}
}

export class FakeAstroVersionProvider implements AstroVersionProvider {
	#version: string;

	constructor(version: string) {
		this.#version = version;
	}

	get version() {
		return this.#version;
	}
}

export class FakeCloudIdeProvider implements CloudIdeProvider {
	#name: CloudIde | null;

	constructor(name: CloudIde | null) {
		this.#name = name;
	}

	get name() {
		return this.#name;
	}
}

export class FakeOperatingSystemProvider implements OperatingSystemProvider {
	#name: NodeJS.Platform;

	constructor(name: NodeJS.Platform) {
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	get displayName() {
		return this.#name;
	}
}

export class SpyCommandExecutor implements CommandExecutor {
	#inputs: Array<{ command: string; args: Array<string> | undefined; input: string | undefined }> =
		[];
	#fail: boolean;

	constructor({ fail = false }: { fail?: boolean } = {}) {
		this.#fail = fail;
	}

	async execute(
		command: string,
		args: Array<string> | undefined,
		options: CommandExecutorOptions | undefined,
	) {
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

export class FakeDebugInfoProvider implements DebugInfoProvider {
	#debugInfo: DebugInfo;

	constructor(debugInfo: DebugInfo) {
		this.#debugInfo = debugInfo;
	}

	async get() {
		return this.#debugInfo;
	}
}

export class SpyClipboard implements Clipboard {
	#texts: Array<string> = [];

	async copy(text: string) {
		this.#texts.push(text);
	}

	get texts() {
		return this.#texts;
	}
}

export class FakePackageManagerUserAgentProvider implements PackageManagerUserAgentProvider {
	#userAgent: string | null;

	constructor(userAgent: string | null) {
		this.#userAgent = userAgent;
	}

	get userAgent() {
		return this.#userAgent;
	}
}

export class FakePrompt implements Prompt {
	#confirmed: boolean;

	constructor(confirmed: boolean) {
		this.#confirmed = confirmed;
	}

	async confirm() {
		return this.#confirmed;
	}
}

export class FakeNodeVersionProvider implements NodeVersionProvider {
	#version: string;

	constructor(version: `v${string}`) {
		this.#version = version;
	}

	get version() {
		return this.#version;
	}
}
