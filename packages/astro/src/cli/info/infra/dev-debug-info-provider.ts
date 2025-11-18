import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider, OperatingSystemProvider } from '../../definitions.js';
import type { DebugInfoProvider, NodeVersionProvider, PackageManager } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';

interface Options {
	config: Pick<AstroConfig, 'output' | 'adapter' | 'integrations'>;
	astroVersionProvider: AstroVersionProvider;
	packageManager: PackageManager;
	operatingSystemProvider: OperatingSystemProvider;
	nodeVersionProvider: NodeVersionProvider;
}

/**
 * Returns light debug info (eg. no versions), to avoid slowing down the dev server
 */
export function createDevDebugInfoProvider({
	config,
	astroVersionProvider,
	packageManager,
	operatingSystemProvider,
	nodeVersionProvider,
}: Options): DebugInfoProvider {
	return {
		async get() {
			const debugInfo: DebugInfo = [
				['Astro', `v${astroVersionProvider.getVersion()}`],
				['Node', nodeVersionProvider.get()],
				['System', operatingSystemProvider.getDisplayName()],
				['Package Manager', packageManager.getName()],
				['Output', config.output],
				['Adapter', config.adapter?.name ?? 'none'],
			];

			const integrations = config.integrations.map((integration) => integration.name);

			debugInfo.push(['Integrations', integrations.length > 0 ? integrations : 'none']);

			return debugInfo;
		},
	};
}
