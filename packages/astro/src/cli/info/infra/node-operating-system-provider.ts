import { arch, platform } from 'node:os';
import type { OperatingSystemProvider } from '../definitions.js';

const PLATFORM_TO_OS: Partial<Record<ReturnType<typeof platform>, string>> = {
	darwin: 'macOS',
	win32: 'Windows',
	linux: 'Linux',
};

export function createNodeOperatingSystemProvider(): OperatingSystemProvider {
	return {
		getName() {
			const _platform = platform();
			const system = PLATFORM_TO_OS[_platform] ?? _platform;
			return `${system} (${arch()})`;
		},
	};
}
