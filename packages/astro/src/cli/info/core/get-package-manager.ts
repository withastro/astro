import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

interface Options {
	configUserAgent: string | undefined;
	commandExecutor: CommandExecutor;
}

export async function getPackageManager({
	configUserAgent,
	commandExecutor,
}: Options): Promise<PackageManager> {
	if (!configUserAgent) {
		const { createNoopPackageManager } = await import('../infra/noop-package-manager.js');
		return createNoopPackageManager();
	}
	const specifier = configUserAgent.split(' ')[0];
	const _name = specifier.substring(0, specifier.lastIndexOf('/'));
	const name = _name === 'npminstall' ? 'cnpm' : _name;

	switch (name) {
		case 'pnpm': {
			const { createPnpmPackageManager } = await import('../infra/pnpm-package-manager.js');
			return createPnpmPackageManager({ commandExecutor });
		}
		case 'npm': {
			const { createNpmPackageManager } = await import('../infra/npm-package-manager.js');
			return createNpmPackageManager({ commandExecutor });
		}
		case 'yarn': {
			const { createYarnPackageManager } = await import('../infra/yarn-package-manager.js');
			return createYarnPackageManager({ commandExecutor });
		}
		case 'bun': {
			const { createBunPackageManager } = await import('../infra/bun-package-manager.js');
			return createBunPackageManager();
		}
		default: {
			const { createNoopPackageManager } = await import('../infra/noop-package-manager.js');
			return createNoopPackageManager();
		}
	}
}
