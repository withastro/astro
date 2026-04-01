import { AstroIntegrationLogger } from '../../../dist/core/logger/core.js';
import type { LogOptions } from '../../../dist/core/logger/core.js';
import type { CloudIde } from '../../../dist/cli/docs/domain/cloud-ide.js';
import type { CloudIdeProvider } from '../../../dist/cli/docs/definitions.js';
import type { AnyCommand } from '../../../dist/cli/domain/command.js';
import type { HelpPayload } from '../../../dist/cli/domain/help-payload.js';
import type { DebugInfo } from '../../../dist/cli/info/domain/debug-info.js';
import type {
	Clipboard,
	NodeVersionProvider,
	PackageManagerUserAgentProvider,
	Prompt,
} from '../../../dist/cli/info/definitions.js';
import type {
	AstroVersionProvider,
	CommandExecutorOptions,
	CommandRunner,
	HelpDisplay,
	OperatingSystemProvider,
} from '../../../dist/cli/definitions.js';
import type { KeyGenerator } from '../../../dist/cli/create-key/definitions.js';
import type { DebugInfoProvider } from '../../../dist/cli/info/definitions.js';

export class PassthroughCommandRunner implements CommandRunner {
	run<T extends AnyCommand>(
		command: T,
		...args: Parameters<T['run']>
	): ReturnType<T['run']> | undefined {
		return command.run(...args) as ReturnType<T['run']>;
	}
}

export class FakeKeyGenerator implements KeyGenerator {
	readonly #key: string;

	constructor(key: string) {
		this.#key = key;
	}

	async generate(): Promise<string> {
		return this.#key;
	}
}

export class SpyHelpDisplay implements HelpDisplay {
	readonly #shouldFire: boolean;
	readonly #payloads: Array<HelpPayload> = [];

	constructor(shouldFire: boolean) {
		this.#shouldFire = shouldFire;
	}

	shouldFire(): boolean {
		return this.#shouldFire;
	}

	show(payload: HelpPayload): void {
		this.#payloads.push(payload);
	}

	get payloads(): Array<HelpPayload> {
		return this.#payloads;
	}
}

export class FakeAstroVersionProvider implements AstroVersionProvider {
	readonly #version: string;

	constructor(version: string) {
		this.#version = version;
	}

	get version(): string {
		return this.#version;
	}
}

export class FakeCloudIdeProvider implements CloudIdeProvider {
	readonly #name: CloudIde | null;

	constructor(name: CloudIde | null) {
		this.#name = name;
	}

	get name(): CloudIde | null {
		return this.#name;
	}
}

export class FakeOperatingSystemProvider implements OperatingSystemProvider {
	readonly #name: NodeJS.Platform;

	constructor(name: NodeJS.Platform) {
		this.#name = name;
	}

	get name(): NodeJS.Platform {
		return this.#name;
	}

	get displayName(): string {
		return this.#name;
	}
}

export class SpyCommandExecutor {
	readonly #inputs: Array<{
		command: string;
		args: Array<string> | undefined;
		input: string | undefined;
	}> = [];
	readonly #fail: boolean;

	constructor({ fail = false }: { fail?: boolean } = {}) {
		this.#fail = fail;
	}

	async execute(
		command: string,
		args: Array<string> | undefined,
		options: CommandExecutorOptions | undefined,
	): Promise<{ stdout: string }> {
		this.#inputs.push({ command, args, input: options?.input });
		if (this.#fail) {
			throw new Error('Command execution failed');
		}
		return { stdout: '' };
	}

	get inputs(): Array<{
		command: string;
		args: Array<string> | undefined;
		input: string | undefined;
	}> {
		return this.#inputs;
	}
}

export class FakeDebugInfoProvider implements DebugInfoProvider {
	readonly #debugInfo: DebugInfo;

	constructor(debugInfo: DebugInfo) {
		this.#debugInfo = debugInfo;
	}

	async get(): Promise<DebugInfo> {
		return this.#debugInfo;
	}
}

export class SpyClipboard implements Clipboard {
	readonly #texts: Array<string> = [];

	async copy(text: string): Promise<void> {
		this.#texts.push(text);
	}

	get texts(): Array<string> {
		return this.#texts;
	}
}

export class FakePackageManagerUserAgentProvider implements PackageManagerUserAgentProvider {
	readonly #userAgent: string | null;

	constructor(userAgent: string | null) {
		this.#userAgent = userAgent;
	}

	get userAgent(): string | null {
		return this.#userAgent;
	}
}

export class FakePrompt implements Prompt {
	readonly #confirmed: boolean;

	constructor(confirmed: boolean) {
		this.#confirmed = confirmed;
	}

	async confirm(): Promise<boolean> {
		return this.#confirmed;
	}
}

export class SpyLogger {
	readonly #logs: Array<{ type: string; label: string | null; message: string }> = [];

	get logs(): Array<{ type: string; label: string | null; message: string }> {
		return this.#logs;
	}

	debug(label: string, ...messages: string[]): void {
		this.#logs.push(...messages.map((message) => ({ type: 'debug', label, message })));
	}

	error(label: string | null, message: string): void {
		this.#logs.push({ type: 'error', label, message });
	}

	info(label: string | null, message: string): void {
		this.#logs.push({ type: 'info', label, message });
	}

	warn(label: string | null, message: string): void {
		this.#logs.push({ type: 'warn', label, message });
	}

	options: LogOptions = {
		dest: { write: () => true },
		level: 'silent',
	};

	level(): 'silent' {
		return this.options.level as 'silent';
	}

	forkIntegrationLogger(label: string): AstroIntegrationLogger {
		return new AstroIntegrationLogger(this.options, label);
	}
}

export class FakeNodeVersionProvider implements NodeVersionProvider {
	readonly #version: string;

	constructor(version: `v${string}`) {
		this.#version = version;
	}

	get version(): string {
		return this.#version;
	}
}
