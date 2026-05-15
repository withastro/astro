import type { Context } from './context.js';
export declare function intro(
	ctx: Pick<Context, 'skipHouston' | 'welcome' | 'hat' | 'tie' | 'version' | 'username' | 'fancy'>,
): Promise<void>;
