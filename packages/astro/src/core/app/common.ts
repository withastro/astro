import { deserializeRouteData } from '../routing/manifest/serialization.js';
import type { RouteInfo, SerializedSSRManifest, SSRManifest } from './types';

export function deserializeManifest(serializedManifest: SerializedSSRManifest): SSRManifest {
	const routes: RouteInfo[] = [];
	for (const serializedRoute of serializedManifest.routes) {
		routes.push({
			...serializedRoute,
			routeData: deserializeRouteData(serializedRoute.routeData),
		});

		const route = serializedRoute as unknown as RouteInfo;
		route.routeData = deserializeRouteData(serializedRoute.routeData);
	}

	const assets = new Set<string>(serializedManifest.assets);

	return {
		...serializedManifest,
		assets,
		routes,
	};
}
