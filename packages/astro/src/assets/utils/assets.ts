import type { Environment, Rolldown } from 'vite';

type EmitFileOptions = Parameters<Rolldown.PluginContext['emitFile']>[0];

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
 * Note: The pluginContext is typed as Rolldown.PluginContext for compatibility
 * with content entry types, but in practice it will always have the `environment`
 * property when running in Vite.
 */
export function emitClientAsset(
	pluginContext: Rolldown.PluginContext,
	options: EmitFileOptions,
): string {
	const env = (pluginContext as Rolldown.PluginContext & { environment: Environment }).environment;
	const handle = pluginContext.emitFile(options);

	const handles = getHandles(env);
	handles.add(handle);

	return handle;
}

// Handles of assets emitted with emitServerAsset(), which must stay in the
// server output even if they are also referenced as client assets.
const serverAssetHandlesByEnvironment = new WeakMap<Environment, Set<string>>();

/**
 * Gets or creates the server asset handle set for an environment
 */
export function getServerHandles(env: Environment): Set<string> {
	let handles = serverAssetHandlesByEnvironment.get(env);
	if (!handles) {
		handles = new Set();
		serverAssetHandlesByEnvironment.set(env, handles);
	}
	return handles;
}

/**
 * Resets the server asset handle tracking for an environment.
 * Called at the start of each build.
 */
export function resetServerHandles(env: Environment): void {
	serverAssetHandlesByEnvironment.set(env, new Set());
}

/**
 * Emit a server-only asset: a file that ships with the server build and is
 * never copied to the client directory, for server code to read at runtime
 * (for example with `fs.readFile(new URL('./data.bin', import.meta.url))`).
 * Use this instead of pluginContext.emitFile for assets that must stay
 * private and next to the server code, even if they are also referenced as
 * client assets.
 *
 * Only meaningful in server environments; in a client build it is the same as
 * pluginContext.emitFile.
 */
export function emitServerAsset(
	pluginContext: Rolldown.PluginContext,
	options: EmitFileOptions,
): string {
	const env = (pluginContext as Rolldown.PluginContext & { environment: Environment }).environment;
	const handle = pluginContext.emitFile(options);

	getServerHandles(env).add(handle);

	return handle;
}

export const ASSETS_ESM_PLUGIN_NAME = 'astro:assets:esm';

export interface AssetsPluginApi {
	markReferenced(fsPath: string): void;
	readonly referencedImages: ReadonlySet<string>;
}

export function getAssetsPluginApi(
	plugins: readonly { name: string; api?: any }[] | undefined,
): AssetsPluginApi | undefined {
	return plugins?.find((plugin) => plugin.name === ASSETS_ESM_PLUGIN_NAME)?.api;
}

/** Keeps an image's original file in the build output, as if its `src` had been read. */
export function markImageReferenced(pluginContext: Rolldown.PluginContext, fsPath: string): void {
	const env = (pluginContext as Rolldown.PluginContext & { environment?: Environment }).environment;
	getAssetsPluginApi(env?.config.plugins)?.markReferenced(fsPath);
}
