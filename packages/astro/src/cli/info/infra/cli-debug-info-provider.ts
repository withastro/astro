import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider } from '../../definitions.js';
import type { DebugInfoProvider, OperatingSystemProvider, PackageManager } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';

interface Options {
	config: AstroConfig;
	astroVersionProvider: AstroVersionProvider;
	packageManager: PackageManager;
	operatingSystemProvider: OperatingSystemProvider;
}

export function createCliDebugInfoProvider({
	config,
	astroVersionProvider,
	packageManager,
	operatingSystemProvider,
}: Options): DebugInfoProvider {
	return {
		async get() {
			const debugInfo: DebugInfo = [
				['Astro', `v${astroVersionProvider.getVersion()}`],
				['Node', process.version],
				['System', operatingSystemProvider.getName()],
				['Package Manager', packageManager.getName()],
				['Output', config.output],
			];

			const viteVersion = await packageManager.getPackageVersion('vite');

			if (viteVersion) {
				debugInfo.splice(1, 0, ['Vite', viteVersion]);
			}

			let adapter = 'none';
			if (config.adapter) {
				const adapterVersion = await packageManager.getPackageVersion(config.adapter.name);
				adapter = `${config.adapter.name}${adapterVersion ? ` (${adapterVersion})` : ''}`;
			}
			debugInfo.push(['Adapter', adapter]);

			const integrations = config.integrations
				.filter(Boolean)
				.flat()
				.map(async (i) => {
					if (!i.name) return;

					const version = await packageManager.getPackageVersion(i.name);

					return `${i.name}${version ? ` (${version})` : ''}`;
				});

			const awaitedIntegrations = (await Promise.all(integrations)).filter(
				(e) => typeof e === 'string',
			);

			debugInfo.push([
				'Integrations',
				awaitedIntegrations.length > 0 ? awaitedIntegrations : 'none',
			]);

			return debugInfo;
		},
	};
}
