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

function withVersion(name: string, version: string | undefined): string {
	let result = name;
	if (version) {
		result += ` (${version})`;
	}
	return result;
}

export function createCliDebugInfoProvider({
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
			];

			const viteVersion = await packageManager.getPackageVersion('vite');

			if (viteVersion) {
				debugInfo.splice(1, 0, ['Vite', viteVersion]);
			}

			debugInfo.push([
				'Adapter',
				config.adapter
					? withVersion(
							config.adapter.name,
							await packageManager.getPackageVersion(config.adapter.name),
						)
					: 'none',
			]);

			const integrations = await Promise.all(
				config.integrations.map(async ({ name }) =>
					withVersion(name, await packageManager.getPackageVersion(name)),
				),
			);

			debugInfo.push(['Integrations', integrations.length > 0 ? integrations : 'none']);

			return debugInfo;
		},
	};
}
