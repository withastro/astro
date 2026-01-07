import type { AstroConfig } from '../../../types/public/index.js';
import type { AstroVersionProvider, OperatingSystemProvider } from '../../definitions.js';
import type { DebugInfoProvider, NodeVersionProvider, PackageManager } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';

function withVersion(name: string, version: string | undefined): string {
	let result = name;
	if (version) {
		result += ` (${version})`;
	}
	return result;
}

export class CliDebugInfoProvider implements DebugInfoProvider {
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
		];

		const viteVersion = await this.#packageManager.getPackageVersion('vite');

		if (viteVersion) {
			debugInfo.splice(1, 0, ['Vite', viteVersion]);
		}

		debugInfo.push([
			'Adapter',
			this.#config.adapter
				? withVersion(
						this.#config.adapter.name,
						await this.#packageManager.getPackageVersion(this.#config.adapter.name),
					)
				: 'none',
		]);

		const integrations = await Promise.all(
			this.#config.integrations.map(async ({ name }) =>
				withVersion(name, await this.#packageManager.getPackageVersion(name)),
			),
		);

		debugInfo.push(['Integrations', integrations.length > 0 ? integrations : 'none']);

		return debugInfo;
	}
}
