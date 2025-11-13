import { renderers } from 'virtual:astro:renderers';
import { routes } from 'virtual:astro:routes';
import { manifest as serializedManifest } from 'virtual:astro:serialized-manifest';
import { pageMap } from 'virtual:astro:pages';
import { serverIslandMap } from 'virtual:astro:server-islands';

export { renderers };

export const manifest = Object.assign(serializedManifest, {
	renderers,
	routes,
	sessionDriver: () => import('virtual:astro:session-driver'),
	actions: () => import('virtual:astro:actions/entrypoint'),
	middleware: () => import('virtual:astro:middleware'),
	pageMap,
	serverIslandMap,
});
