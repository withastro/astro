import type { OperatingSystemProvider } from '../definitions.js';

export class ProcessOperatingSystemProvider implements OperatingSystemProvider {
	readonly #platformToOs: Partial<Record<NodeJS.Platform, string>> = {
		darwin: 'macOS',
		win32: 'Windows',
		linux: 'Linux',
	};

	readonly name: NodeJS.Platform = process.platform;
	readonly displayName: string = `${this.#platformToOs[this.name] ?? this.name} (${process.arch})`;
}
