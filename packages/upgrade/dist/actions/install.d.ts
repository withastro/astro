import { shell } from '../shell.js';
import type { Context } from './context.js';
export declare function install(
	ctx: Pick<
		Context,
		'version' | 'packages' | 'packageManager' | 'prompt' | 'dryRun' | 'exit' | 'cwd'
	>,
	shellFn?: typeof shell,
): Promise<undefined>;
