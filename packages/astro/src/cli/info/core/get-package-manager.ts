import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager, PackageManagerUserAgentProvider } from '../definitions.js';

interface Options {
	packageManagerUserAgentProvider: PackageManagerUserAgentProvider;
	commandExecutor: CommandExecutor;
}

export async function getPackageManager({
	packageManagerUserAgentProvider,
	commandExecutor,
}: Options): Promise<PackageManager> {
	const userAgent = packageManagerUserAgentProvider.getUserAgent();
	if (!userAgent) {
		const { createNoopPackageManager } = await import('../infra/noop-package-manager.js');
		return createNoopPackageManager();
	}
	const specifier = userAgent.split(' ')[0];
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
			const { BunPackageManager } = await import('../infra/bun-package-manager.js');
			return new BunPackageManager();
		}
		default: {
			const { createNoopPackageManager } = await import('../infra/noop-package-manager.js');
			return createNoopPackageManager();
		}
	}
}
