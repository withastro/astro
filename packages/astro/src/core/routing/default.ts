import type { ManifestData } from "#astro/@types/astro";
import type { ModuleLoader } from "../module-loader/loader.js";
import { ensureServerIslandRoute } from "../server-islands/endpoint.js";
import { ensure404Route } from './astro-designed-error-pages.js';

export function injectDefaultRoutes(manifest: ManifestData, loader: ModuleLoader) {
	ensure404Route(manifest);
	return manifest;
}
