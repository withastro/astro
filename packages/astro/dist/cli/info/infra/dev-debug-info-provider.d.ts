import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider, OperatingSystemProvider } from '../../definitions.js';
import type { DebugInfoProvider, NodeVersionProvider, PackageManager } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';
/**
 * Returns debug info without any package versions, to avoid slowing down the dev server
 */
export declare class DevDebugInfoProvider implements DebugInfoProvider {
	#private;
	constructor({
		config,
		astroVersionProvider,
		packageManager,
		operatingSystemProvider,
		nodeVersionProvider,
	}: {
		config: Pick<AstroConfig, 'output' | 'adapter' | 'integrations'>;
		astroVersionProvider: AstroVersionProvider;
		packageManager: PackageManager;
		operatingSystemProvider: OperatingSystemProvider;
		nodeVersionProvider: NodeVersionProvider;
	});
	get(): Promise<DebugInfo>;
}
