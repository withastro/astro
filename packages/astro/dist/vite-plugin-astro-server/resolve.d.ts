import type { ModuleLoader } from '../core/module-loader/index.js';
export declare function createResolve(
	loader: ModuleLoader,
	root: URL,
): (s: string) => Promise<string>;
