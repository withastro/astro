import type { AstroConfig } from '../../../types/public/index.js';
import type { Flags } from '../../flags.js';
import type { AstroConfigResolver } from '../definitions.js';
export declare class CliAstroConfigResolver implements AstroConfigResolver {
	#private;
	constructor({ flags }: { flags: Flags });
	resolve(): Promise<AstroConfig>;
}
