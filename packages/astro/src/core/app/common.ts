import { deserializeRouteData } from '../routing/manifest/serialization.js';
import type {
	RouteInfo,
	SerializedSSRManifest,
	SSRBaseManifest,
	SSRSplitManifest,
	SSRServerManifest,
} from './types';

export function deserializeManifest(serializedManifest: SerializedSSRManifest): SSRBaseManifest {
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
	const componentMetadata = new Map(serializedManifest.componentMetadata);
	const clientDirectives = new Map(serializedManifest.clientDirectives);

	return <SSRServerManifest | SSRSplitManifest>{
		...serializedManifest,
		assets,
		componentMetadata,
		clientDirectives,
		routes,
	};
}
