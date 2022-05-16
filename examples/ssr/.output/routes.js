import { Router } from '@layer0/core';

const TIME_1H = 60 * 60;
const TIME_4H = TIME_1H * 4;
const TIME_1D = TIME_1H * 24;

const CACHE_ASSETS = {
	edge: {
		maxAgeSeconds: TIME_1D,
		forcePrivateCaching: true,
		staleWhileRevalidateSeconds: TIME_1H,
	},
	browser: {
		maxAgeSeconds: 0,
		serviceWorkerSeconds: TIME_1D,
		spa: true,
	},
};

export default new Router().match('/:path*', ({ cache, serveStatic, renderWithApp }) => {
	cache(CACHE_ASSETS);
	// serveStatic('client/:path*', {
	// 	onNotFound: () => renderWithApp,
	// });
	renderWithApp()
});