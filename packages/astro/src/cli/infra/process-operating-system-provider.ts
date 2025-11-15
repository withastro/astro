import type { OperatingSystemProvider } from '../definitions.js';

const PLATFORM_TO_OS: Partial<Record<NodeJS.Platform, string>> = {
	darwin: 'macOS',
	win32: 'Windows',
	linux: 'Linux',
};

export function createProcessOperatingSystemProvider(): OperatingSystemProvider {
	const platform = process.platform;
	return {
		getName() {
			return platform;
		},
		getDisplayName() {
			const system = PLATFORM_TO_OS[platform] ?? platform;
			return `${system} (${process.arch})`;
		},
	};
}
