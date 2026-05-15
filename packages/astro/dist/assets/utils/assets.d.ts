import type { Environment, Rollup } from 'vite';
type PluginContext = Rollup.PluginContext;
type EmitFileOptions = Parameters<Rollup.PluginContext['emitFile']>[0];
/**
 * Gets or creates the handle set for an environment
 */
export declare function getHandles(env: Environment): Set<string>;
/**
 * Resets the handle tracking for an environment.
 * Called at the start of each build.
 */
export declare function resetHandles(env: Environment): void;
/**
 * Emit a client asset and track it for later movement to the client directory.
 * Use this instead of pluginContext.emitFile for assets that should
 * be moved from the server/prerender directory to the client directory.
 *
 * Note: The pluginContext is typed as Rollup.PluginContext for compatibility
 * with content entry types, but in practice it will always have the `environment`
 * property when running in Vite.
 */
export declare function emitClientAsset(
	pluginContext: PluginContext,
	options: EmitFileOptions,
): string;
export {};
