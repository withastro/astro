import {
	WebSocketAlreadyUpgraded,
	WebSocketNotUpgradeRequest,
} from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { AstroWebSocket, UpgradeWebSocketHook, WebSocketUpgrade } from './types.js';

const WEBSOCKET_KEY = 'websocket';

/**
 * Registers `context.websocket` on the given `FetchState` when the adapter
 * passed an `upgradeWebSocket` hook to `app.render()`. Without a hook,
 * `context.websocket` is `undefined`.
 */
export function provideWebSocket(state: FetchState): void {
	const hook = state.renderOptions.upgradeWebSocket;
	if (!hook) return;
	state.provide<AstroWebSocket>(WEBSOCKET_KEY, {
		create() {
			return createAstroWebSocket(state.request, hook);
		},
	});
}

function createAstroWebSocket(request: Request, hook: UpgradeWebSocketHook): AstroWebSocket {
	let upgraded: WebSocketUpgrade | undefined;
	return {
		isUpgradeRequest() {
			return isWebSocketUpgradeRequest(request);
		},
		upgrade() {
			if (upgraded) throw new AstroError(WebSocketAlreadyUpgraded);
			if (!isWebSocketUpgradeRequest(request)) throw new AstroError(WebSocketNotUpgradeRequest);
			upgraded = hook(request);
			return upgraded;
		},
	};
}

/**
 * Returns a `403` response for a WebSocket upgrade request sent by a page on
 * another site, or `undefined` to let the request continue. Runs only when
 * the adapter can accept upgrades, before middleware, and regardless of
 * `security.checkOrigin`.
 *
 * Browsers apply no CORS rules to WebSocket handshakes and can attach the
 * user's cookies to them, so without this check any site could open a
 * connection as the signed-in user (cross-site WebSocket hijacking).
 */
export function rejectCrossSiteWebSocket(state: FetchState): Response | undefined {
	if (!state.renderOptions.upgradeWebSocket) return;
	if (!isWebSocketUpgradeRequest(state.request)) return;
	if (!isCrossSiteRequest(state.request, state.url)) return;
	return new Response('Cross-site WebSocket connections are forbidden', { status: 403 });
}

function isCrossSiteRequest(request: Request, url: URL): boolean {
	const fetchSite = request.headers.get('sec-fetch-site');
	if (fetchSite) return fetchSite !== 'same-origin';
	// Browsers always send `Origin` on WebSocket handshakes. Clients that omit it
	// are not browsers, so they cannot carry another site's user's cookies.
	const origin = request.headers.get('origin');
	return origin !== null && origin !== url.origin;
}

export function isWebSocketUpgradeRequest(request: Request): boolean {
	if (request.method !== 'GET') return false;
	const upgrade = request.headers.get('upgrade');
	if (!upgrade) return false;
	// `Upgrade` is a comma-separated list of protocols, matched case-insensitively (RFC 9110 §7.8).
	return upgrade
		.toLowerCase()
		.split(',')
		.some((protocol) => protocol.trim() === 'websocket');
}
