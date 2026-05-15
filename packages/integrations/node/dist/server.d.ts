import * as options from 'virtual:astro-node:config';
export { options };
export declare const handler: import('./types.js').RequestHandler;
export declare const startServer: () => {
	server: {
		host: string;
		port: number;
		closed(): Promise<void>;
		stop(): Promise<void>;
		server:
			| import('http').Server<
					typeof import('http').IncomingMessage,
					typeof import('http').ServerResponse
			  >
			| import('https').Server<
					typeof import('http').IncomingMessage,
					typeof import('http').ServerResponse
			  >;
	};
	done: Promise<void>;
};
