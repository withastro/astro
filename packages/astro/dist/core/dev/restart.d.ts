import type nodeFs from 'node:fs';
import type { AstroInlineConfig } from '../../types/public/config.js';
import type { Container } from './container.js';
interface CreateContainerWithAutomaticRestart {
	inlineConfig?: AstroInlineConfig;
	fs?: typeof nodeFs;
}
interface Restart {
	container: Container;
	bindCLIShortcuts: () => void;
	restarted: () => Promise<Error | null>;
}
export declare function createContainerWithAutomaticRestart({
	inlineConfig,
	fs,
}: CreateContainerWithAutomaticRestart): Promise<Restart>;
export {};
