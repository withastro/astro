function formatPnpmVersionOutput(versionOutput) {
	return versionOutput.startsWith('link:') ? 'Local' : `v${versionOutput}`;
}
class PnpmPackageManager {
	name = 'pnpm';
	#commandExecutor;
	constructor({ commandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}
	async getPackageVersion(name) {
		try {
			const { stdout } = await this.#commandExecutor.execute('pnpm', ['why', name, '--json'], {
				shell: true,
			});
			const parsedOutput = JSON.parse(stdout);
			const deps = parsedOutput[0].dependencies;
			if (parsedOutput.length === 0 || !deps) {
				return void 0;
			}
			const userProvidedDependency = deps[name];
			if (userProvidedDependency) {
				return formatPnpmVersionOutput(userProvidedDependency.version);
			}
			const astroDependency = deps.astro?.dependencies[name];
			return astroDependency ? formatPnpmVersionOutput(astroDependency.version) : void 0;
		} catch {
			return void 0;
		}
	}
}
export { PnpmPackageManager };
