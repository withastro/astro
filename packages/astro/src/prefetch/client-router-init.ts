import { init } from './index.js';

/** Registered with `addClientRouterInit()`: `<ClientRouter />` prefetches every link. */
export default function initClientRouterPrefetch() {
	init({ prefetchAll: true });
}
