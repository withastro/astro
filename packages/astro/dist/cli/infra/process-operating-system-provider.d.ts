import type { OperatingSystemProvider } from '../definitions.js';
export declare class ProcessOperatingSystemProvider implements OperatingSystemProvider {
	#private;
	readonly name: NodeJS.Platform;
	readonly displayName: string;
}
