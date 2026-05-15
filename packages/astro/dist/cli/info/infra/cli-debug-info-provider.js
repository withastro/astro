function withVersion(name, version) {
	let result = name;
	if (version) {
		result += ` (${version})`;
	}
	return result;
}
class CliDebugInfoProvider {
	#config;
	#astroVersionProvider;
	#packageManager;
	#operatingSystemProvider;
	#nodeVersionProvider;
	constructor({
		config,
		astroVersionProvider,
		packageManager,
		operatingSystemProvider,
		nodeVersionProvider,
	}) {
		this.#config = config;
		this.#astroVersionProvider = astroVersionProvider;
		this.#packageManager = packageManager;
		this.#operatingSystemProvider = operatingSystemProvider;
		this.#nodeVersionProvider = nodeVersionProvider;
	}
	async get() {
		const debugInfo = [
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
export { CliDebugInfoProvider };
