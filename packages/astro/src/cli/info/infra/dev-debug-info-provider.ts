import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider, OperatingSystemProvider } from '../../definitions.js';
import type { DebugInfoProvider, NodeVersionProvider, PackageManager } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';

/**
 * Returns debug info without any package versions, to avoid slowing down the dev server
 */
export class DevDebugInfoProvider implements DebugInfoProvider {
	readonly #config: Pick<AstroConfig, 'output' | 'adapter' | 'integrations'>;
	readonly #astroVersionProvider: AstroVersionProvider;
	readonly #packageManager: PackageManager;
	readonly #operatingSystemProvider: OperatingSystemProvider;
	readonly #nodeVersionProvider: NodeVersionProvider;

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
	}) {
		this.#config = config;
		this.#astroVersionProvider = astroVersionProvider;
		this.#packageManager = packageManager;
		this.#operatingSystemProvider = operatingSystemProvider;
		this.#nodeVersionProvider = nodeVersionProvider;
	}

	async get(): Promise<DebugInfo> {
		const debugInfo: DebugInfo = [
			['Astro', `v${this.#astroVersionProvider.version}`],
			['Node', this.#nodeVersionProvider.version],
			['System', this.#operatingSystemProvider.displayName],
			['Package Manager', this.#packageManager.name],
			['Output', this.#config.output],
			['Adapter', this.#config.adapter?.name ?? 'none'],
		];

		const integrations = this.#config.integrations.map((integration) => integration.name);

		debugInfo.push(['Integrations', integrations.length > 0 ? integrations : 'none']);

		return debugInfo;
	}
}
