import type { AstroVersionProvider } from '../definitions.js';

export function createBuildTimeAstroVersionProvider(): AstroVersionProvider {
	const version = process.env.PACKAGE_VERSION ?? '';
	return {
		getVersion() {
			return version;
		},
	};
}
