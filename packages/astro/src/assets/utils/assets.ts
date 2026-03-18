import type { Environment, Rollup } from 'vite';

type PluginContext = Rollup.PluginContext;
type EmitFileOptions = Parameters<Rollup.PluginContext['emitFile']>[0];

// WeakMap keyed by Environment objects to track emitted asset handles
// Using WeakMap ensures automatic cleanup when environments are garbage collected
const assetHandlesByEnvironment = new WeakMap<Environment, Set<string>>();

/**
 * Gets or creates the handle set for an environment
 */
export function getHandles(env: Environment): Set<string> {
	let handles = assetHandlesByEnvironment.get(env);
	if (!handles) {
		handles = new Set();
		assetHandlesByEnvironment.set(env, handles);
	}
	return handles;
}

/**
 * Resets the handle tracking for an environment.
 * Called at the start of each build.
 */
export function resetHandles(env: Environment): void {
	assetHandlesByEnvironment.set(env, new Set());
}

/**
 * Emit a client asset and track it for later movement to the client directory.
 * Use this instead of pluginContext.emitFile for assets that should
 * be moved from the server/prerender directory to the client directory.
 *
 * Note: The pluginContext is typed as Rollup.PluginContext for compatibility
 * with content entry types, but in practice it will always have the `environment`
 * property when running in Vite.
 */
export function emitClientAsset(pluginContext: PluginContext, options: EmitFileOptions): string {
	const env = (pluginContext as PluginContext & { environment: Environment }).environment;
	const handle = pluginContext.emitFile(options);

	const handles = getHandles(env);
	handles.add(handle);

	return handle;
}
