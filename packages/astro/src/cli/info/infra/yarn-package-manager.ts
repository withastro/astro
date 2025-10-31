import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

interface YarnVersionOutputLine {
	children: Record<string, { locator: string }>;
}

function getYarnOutputDepVersion(dependency: string, outputLine: string) {
	const parsed = JSON.parse(outputLine) as YarnVersionOutputLine;

	for (const [key, value] of Object.entries(parsed.children)) {
		if (key.startsWith(`${dependency}@`)) {
			return `v${value.locator.split(':').pop()}`;
		}
	}
}

interface Options {
	commandExecutor: CommandExecutor;
}

export function createYarnPackageManager({ commandExecutor }: Options): PackageManager {
	return {
		getName() {
			return 'yarn';
		},
		async getPackageVersion(name) {
			const { stdout } = await commandExecutor.execute('yarn', ['why', name, '--json'], {
				shell: true,
			});

			const hasUserDefinition = stdout.includes('workspace:.');

			for (const line of stdout.split('\n')) {
				if (hasUserDefinition && line.includes('workspace:.'))
					return getYarnOutputDepVersion(name, line);
				if (!hasUserDefinition && line.includes('astro@'))
					return getYarnOutputDepVersion(name, line);
			}
		},
	};
}
