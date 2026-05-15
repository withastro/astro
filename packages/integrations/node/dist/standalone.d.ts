import http from 'node:http';
import https from 'node:https';
import type { BaseApp } from 'astro/app';
import type { NodeAppHeadersJson, Options } from './types.js';
export declare const hostOptions: (host: Options['host']) => string;
export default function standalone(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
): {
	server: {
		host: string;
		port: number;
		closed(): Promise<void>;
		stop(): Promise<void>;
		server:
			| http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
			| https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
	};
	done: Promise<void>;
};
export declare function createStandaloneHandler(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
): (req: http.IncomingMessage, res: http.ServerResponse) => void;
export declare function createServer(
	listener: http.RequestListener,
	host: string,
	port: number,
): {
	host: string;
	port: number;
	closed(): Promise<void>;
	stop(): Promise<void>;
	server:
		| http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
		| https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
};
