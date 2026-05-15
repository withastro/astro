import type { Context } from './context.js';
export declare function git(
	ctx: Pick<Context, 'cwd' | 'git' | 'yes' | 'prompt' | 'dryRun' | 'tasks'>,
): Promise<void>;
