type ErrorState = 'fresh' | 'error';
interface RouteState {
	state: ErrorState;
	error?: Error;
}
export interface ServerState {
	routes: Map<string, RouteState>;
	state: ErrorState;
	error?: Error;
}
export declare function createServerState(): ServerState;
export declare function setRouteError(
	serverState: ServerState,
	pathname: string,
	error: Error | undefined,
): void;
export declare function setServerError(serverState: ServerState, error: Error): void;
export declare function clearRouteError(serverState: ServerState, pathname: string): void;
export {};
