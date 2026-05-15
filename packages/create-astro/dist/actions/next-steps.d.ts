import type { Context } from './context.js';
export declare function next(
	ctx: Pick<Context, 'hat' | 'tie' | 'cwd' | 'packageManager' | 'skipHouston'>,
): Promise<void>;
