import type { SSRManifest, SerializedSSRManifest, RouteInfo } from './types';
import { deserializeRouteData } from '../routing/manifest/serialization.js';

export function deserializeManifest(serializedManifest: SerializedSSRManifest): SSRManifest {
	const routes: RouteInfo[] = [];
	for(const serializedRoute of serializedManifest.routes) {
		routes.push({
			...serializedRoute,
			routeData: deserializeRouteData(serializedRoute.routeData)
		});

		const route = serializedRoute as unknown as RouteInfo;
		route.routeData = deserializeRouteData(serializedRoute.routeData);
	}

	return {
		...serializedManifest,
		routes
	};
}
