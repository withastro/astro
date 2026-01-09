import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

function formatPnpmVersionOutput(versionOutput: string): string {
	return versionOutput.startsWith('link:') ? 'Local' : `v${versionOutput}`;
}

interface BareNpmLikeVersionOutput {
	version: string;
	dependencies: Record<string, BareNpmLikeVersionOutput>;
}

export class PnpmPackageManager implements PackageManager {
	readonly name: string = 'pnpm';
	readonly #commandExecutor: CommandExecutor;

	constructor({ commandExecutor }: { commandExecutor: CommandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}

	async getPackageVersion(name: string): Promise<string | undefined> {
		try {
			// https://pnpm.io/cli/why
			const { stdout } = await this.#commandExecutor.execute('pnpm', ['why', name, '--json'], {
				shell: true,
			});

			const parsedOutput = JSON.parse(stdout) as Array<BareNpmLikeVersionOutput>;

			const deps = parsedOutput[0].dependencies;

			if (parsedOutput.length === 0 || !deps) {
				return undefined;
			}

			const userProvidedDependency = deps[name];

			if (userProvidedDependency) {
				return formatPnpmVersionOutput(userProvidedDependency.version);
			}

			const astroDependency = deps.astro?.dependencies[name];
			return astroDependency ? formatPnpmVersionOutput(astroDependency.version) : undefined;
		} catch {
			return undefined;
		}
	}
}
