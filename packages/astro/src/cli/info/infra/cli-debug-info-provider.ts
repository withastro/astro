import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider } from '../../definitions.js';
import type {
	DebugInfoProvider,
	OperatingSystemProvider,
	PackageManagerProvider,
	PackageVersionProvider,
} from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';

interface Options {
	config: AstroConfig;
	astroVersionProvider: AstroVersionProvider;
	packageManagerProvider: PackageManagerProvider;
	operatingSystemProvider: OperatingSystemProvider;
	packageVersionProvider: PackageVersionProvider;
}

export function createCliDebugInfoProvider({
	config,
	astroVersionProvider,
	packageManagerProvider,
	operatingSystemProvider,
	packageVersionProvider,
}: Options): DebugInfoProvider {
	return {
		async get() {
			const packageManager = packageManagerProvider.getName();

			const debugInfo: DebugInfo = [
				['Astro', `v${astroVersionProvider.getVersion()}`],
				['Node', process.version],
				['System', operatingSystemProvider.getName()],
				['Package Manager', packageManager],
				['Output', config.output],
			];

			const viteVersion = await packageVersionProvider.getVersion('vite');

			if (viteVersion) {
				debugInfo.splice(1, 0, ['Vite', viteVersion]);
			}

			let adapter = 'none';
			if (config.adapter) {
				const adapterVersion = await packageVersionProvider.getVersion(config.adapter.name);
				adapter = `${config.adapter.name}${adapterVersion ? ` (${adapterVersion})` : ''}`;
			}
			debugInfo.push(['Adapter', adapter]);

			const integrations = config.integrations
				.filter(Boolean)
				.flat()
				.map(async (i) => {
					if (!i.name) return;

					const version = await packageVersionProvider.getVersion(i.name);

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
