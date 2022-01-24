/// <reference types="node" />
import { Server } from 'http';
import { ServerOptions as HttpsServerOptions } from 'https';
import { WebSocket as WebSocketTypes } from 'types/ws';
import { HMRPayload } from 'types/hmrPayload';
import { ResolvedConfig } from '..';
export declare const HMR_HEADER = "vite-hmr";
export interface WebSocketServer {
    on: WebSocketTypes.Server['on'];
    off: WebSocketTypes.Server['off'];
    send(payload: HMRPayload): void;
    close(): Promise<void>;
}
export declare function createWebSocketServer(server: Server | null, config: ResolvedConfig, httpsOptions?: HttpsServerOptions): WebSocketServer;
