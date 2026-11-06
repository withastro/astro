import type { AstroVersionProvider } from '../definitions.js';

export class BuildTimeAstroVersionProvider implements AstroVersionProvider {
	// Injected during the build through rolldown define
	readonly version: string = process.env.PACKAGE_VERSION ?? '';
}
