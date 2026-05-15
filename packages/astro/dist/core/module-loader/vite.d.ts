import type * as vite from 'vite';
import type { RunnableDevEnvironment } from 'vite';
import type { ModuleLoader } from './runner.js';
export declare function createViteLoader(
	viteServer: vite.ViteDevServer,
	ssrEnvironment: RunnableDevEnvironment,
): ModuleLoader;
