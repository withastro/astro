import { ensureImageEndpointRoute } from '../../assets/endpoint/config.js';
import type { AstroSettings, ManifestData } from '../../types/astro.js';
import type { SSRManifest } from '../app/types.js';
import { injectDefaultRoutes } from './default.js';

export function injectDefaultDevRoutes(
	settings: AstroSettings,
	ssrManifest: SSRManifest,
	routeManifest: ManifestData,
) {
	ensureImageEndpointRoute(settings, routeManifest, 'dev');
	injectDefaultRoutes(ssrManifest, routeManifest);
	return routeManifest;
}
