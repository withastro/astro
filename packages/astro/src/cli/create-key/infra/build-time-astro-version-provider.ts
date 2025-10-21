import type { AstroVersionProvider } from '../definitions.js';

export function createBuildTimeAstroVersionProvider(): AstroVersionProvider {
	return {
		getVersion() {
			return process.env.PACKAGE_VERSION ?? '';
		},
	};
}
