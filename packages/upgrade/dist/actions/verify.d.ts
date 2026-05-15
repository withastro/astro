import type { Context } from './context.js';
export declare function verify(
	ctx: Pick<Context, 'version' | 'packages' | 'cwd' | 'dryRun' | 'exit'>,
): Promise<void>;
export declare function collectPackageInfo(
	ctx: Pick<Context, 'version' | 'packages'>,
	dependencies?: Record<string, string>,
	devDependencies?: Record<string, string>,
): void;
