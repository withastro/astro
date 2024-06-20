import type { ComponentInstance, ManifestData, SSRManifest, } from "../../@types/astro.js";
import { DEFAULT_404_COMPONENT } from "../constants.js";
import { ensureServerIslandRoute, createEndpoint as createServerIslandEndpoint, SERVER_ISLAND_ROUTE, SERVER_ISLAND_COMPONENT } from "../server-islands/endpoint.js";
import { ensure404Route, default404Instance, DEFAULT_404_ROUTE } from './astro-designed-error-pages.js';

export function injectDefaultRoutes(manifest: ManifestData) {
	ensure404Route(manifest);
	ensureServerIslandRoute(manifest);
	return manifest;
}

type DefaultRouteParams = {
	instance: ComponentInstance;
	matchesComponent(filePath: URL): boolean;
	route: string;
}

export function createDefaultRoutes(manifest: SSRManifest, root: URL): DefaultRouteParams[] {
	return [
		{
			instance: default404Instance,
			matchesComponent: (filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href,
			route: DEFAULT_404_ROUTE.route,
		},
		{
			instance: createServerIslandEndpoint(manifest),
			matchesComponent: (filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href,
			route: SERVER_ISLAND_ROUTE,
		}
	];
}
