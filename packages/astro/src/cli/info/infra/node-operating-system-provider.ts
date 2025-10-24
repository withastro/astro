import { arch, platform } from 'node:os';
import type { OperatingSystemProvider } from '../definitions.js';

const PLATFORM_TO_OS: Partial<Record<ReturnType<typeof platform>, string>> = {
	darwin: 'macOS',
	win32: 'Windows',
	linux: 'Linux',
};

// TODO: unify with createProcessPlatformProvider somehow
export function createNodeOperatingSystemProvider(): OperatingSystemProvider {
	const _platform = platform();
	return {
		getName() {
			return _platform;
		},
		getDisplayName() {
			const system = PLATFORM_TO_OS[_platform] ?? _platform;
			return `${system} (${arch()})`;
		},
	};
}
