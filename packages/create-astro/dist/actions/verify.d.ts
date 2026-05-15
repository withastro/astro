import type { Context } from './context.js';
export declare function verify(
	ctx: Pick<Context, 'version' | 'dryRun' | 'template' | 'ref' | 'exit'>,
): Promise<void>;
