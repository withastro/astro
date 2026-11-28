/**
 * The result of accepting a WebSocket upgrade: the server side of the
 * connection, and the response the route must return to complete it.
 */
export interface WebSocketUpgrade {
	/**
	 * The server side of the connection. Its `readyState` is `CONNECTING`
	 * until the route's response is sent, so `send()` must wait for the
	 * `open` event.
	 */
	socket: WebSocket;
	/**
	 * The response that completes the upgrade. Return it from the route,
	 * either directly or after adding headers to it. Returning any other
	 * response rejects the upgrade, and the client receives that response
	 * instead.
	 */
	response: Response;
}

/**
 * Implemented by adapters that can accept WebSocket connections, and passed
 * to `app.render()` as the `upgradeWebSocket` option. Called at most once
 * per request, only for requests that ask to upgrade.
 */
export type UpgradeWebSocketHook = (request: Request) => WebSocketUpgrade;

/**
 * Available as `context.websocket` in on-demand routes and middleware when
 * the adapter can accept WebSocket connections.
 */
export interface AstroWebSocket {
	/**
	 * Whether the request asks to upgrade to a WebSocket connection: a `GET`
	 * request whose `Upgrade` header includes `websocket`.
	 */
	isUpgradeRequest(): boolean;
	/**
	 * Accepts the upgrade. Return `response` from the route to complete it.
	 *
	 * @throws {AstroError} `WebSocketNotUpgradeRequest` when `isUpgradeRequest()` is `false`.
	 * @throws {AstroError} `WebSocketAlreadyUpgraded` when called more than once for a request.
	 */
	upgrade(): WebSocketUpgrade;
}
