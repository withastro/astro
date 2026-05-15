class DevDebugInfoProvider {
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
			['Adapter', this.#config.adapter?.name ?? 'none'],
		];
		const integrations = this.#config.integrations.map((integration) => integration.name);
		debugInfo.push(['Integrations', integrations.length > 0 ? integrations : 'none']);
		return debugInfo;
	}
}
export { DevDebugInfoProvider };
