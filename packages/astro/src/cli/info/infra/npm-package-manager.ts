import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

interface BareNpmLikeVersionOutput {
	version: string;
	dependencies: Record<string, BareNpmLikeVersionOutput>;
}

export class NpmPackageManager implements PackageManager {
	readonly name: string = 'npm';
	readonly #commandExecutor: CommandExecutor;

	constructor({ commandExecutor }: { commandExecutor: CommandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}

	async getPackageVersion(name: string): Promise<string | undefined> {
		try {
			// https://docs.npmjs.com/cli/v9/commands/npm-ls
			const { stdout } = await this.#commandExecutor.execute(
				'npm',
				['ls', name, '--json', '--depth=1'],
				{
					shell: true,
				},
			);
			const parsedNpmOutput = JSON.parse(stdout) as BareNpmLikeVersionOutput;

			if (!parsedNpmOutput.dependencies) {
				return undefined;
			}

			if (parsedNpmOutput.dependencies[name]) {
				return `v${parsedNpmOutput.dependencies[name].version}`;
			}

			const astro = parsedNpmOutput.dependencies.astro;
			return astro ? `v${astro.dependencies[name].version}` : undefined;
		} catch {
			return undefined;
		}
	}
}
