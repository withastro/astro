import type { Environment, Rolldown } from 'vite';

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
