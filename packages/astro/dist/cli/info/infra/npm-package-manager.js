class NpmPackageManager {
	name = 'npm';
	#commandExecutor;
	constructor({ commandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}
	async getPackageVersion(name) {
		try {
			const { stdout } = await this.#commandExecutor.execute(
				'npm',
				['ls', name, '--json', '--depth=1'],
				{
					shell: true,
				},
			);
			const parsedNpmOutput = JSON.parse(stdout);
			if (!parsedNpmOutput.dependencies) {
				return void 0;
			}
			if (parsedNpmOutput.dependencies[name]) {
				return `v${parsedNpmOutput.dependencies[name].version}`;
			}
			const astro = parsedNpmOutput.dependencies.astro;
			return astro ? `v${astro.dependencies[name].version}` : void 0;
		} catch {
			return void 0;
		}
	}
}
export { NpmPackageManager };
