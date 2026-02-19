import type { AstroVersionProvider } from '../definitions.js';

export class BuildTimeAstroVersionProvider implements AstroVersionProvider {
	// Injected during the build through esbuild define
	readonly version: string = process.env.PACKAGE_VERSION ?? '';
}
