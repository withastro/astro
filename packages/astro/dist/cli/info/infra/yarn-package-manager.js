function getYarnOutputDepVersion(dependency, outputLine) {
	const parsed = JSON.parse(outputLine);
	for (const [key, value] of Object.entries(parsed.children)) {
		if (key.startsWith(`${dependency}@`)) {
			return `v${value.locator.split(':').pop()}`;
		}
	}
}
class YarnPackageManager {
	name = 'yarn';
	#commandExecutor;
	constructor({ commandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}
	async getPackageVersion(name) {
		try {
			const { stdout } = await this.#commandExecutor.execute('yarn', ['why', name, '--json'], {
				shell: true,
			});
			const hasUserDefinition = stdout.includes('workspace:.');
			for (const line of stdout.split('\n')) {
				if (hasUserDefinition && line.includes('workspace:.'))
					return getYarnOutputDepVersion(name, line);
				if (!hasUserDefinition && line.includes('astro@'))
					return getYarnOutputDepVersion(name, line);
			}
		} catch {
			return void 0;
		}
	}
}
export { YarnPackageManager };
