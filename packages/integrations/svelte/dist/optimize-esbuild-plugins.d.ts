import type { DepOptimizationOptions } from 'vite';
type OptimizeDepsEsbuildPlugins = NonNullable<
	NonNullable<DepOptimizationOptions['esbuildOptions']>['plugins']
>;
export declare function createSvelteOptimizeEsbuildPlugins(
	generate: 'server' | 'client',
): OptimizeDepsEsbuildPlugins;
export {};
