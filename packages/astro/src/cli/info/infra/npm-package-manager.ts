import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

interface BareNpmLikeVersionOutput {
	version: string;
	dependencies: Record<string, BareNpmLikeVersionOutput>;
}

interface Options {
	commandExecutor: CommandExecutor;
}

export function createNpmPackageManager({ commandExecutor }: Options): PackageManager {
	return {
		getName() {
			return 'npm';
		},
		async getPackageVersion(name) {
			const { stdout } = await commandExecutor.execute('npm', ['ls', name, '--json', '--depth=1'], {
				shell: true,
			});
			const parsedNpmOutput = JSON.parse(stdout) as BareNpmLikeVersionOutput;

			if (!parsedNpmOutput.dependencies) {
				return undefined;
			}

			if (parsedNpmOutput.dependencies[name]) {
				return `v${parsedNpmOutput.dependencies[name].version}`;
			}

			const astro = parsedNpmOutput.dependencies.astro;
			return astro ? `v${astro.dependencies[name].version}` : undefined;
		},
	};
}
