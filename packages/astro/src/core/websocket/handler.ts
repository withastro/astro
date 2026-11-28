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
