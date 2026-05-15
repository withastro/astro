import type { Context } from './context.js';
export declare function projectName(
	ctx: Pick<Context, 'yes' | 'dryRun' | 'prompt' | 'projectName' | 'exit'> & {
		cwd?: string;
	},
): Promise<void>;
