/// <reference types="node" />
import { Server as HttpServer } from 'http';
import { ServerOptions as HttpsServerOptions } from 'https';
import { ProxyOptions } from './server/middlewares/proxy';
import { Connect } from 'types/connect';
import { Logger } from './logger';
export interface CommonServerOptions {
    /**
     * Specify server port. Note if the port is already being used, Vite will
     * automatically try the next available port so this may not be the actual
     * port the server ends up listening on.
     */
    port?: number;
    /**
     * If enabled, vite will exit if specified port is already in use
     */
    strictPort?: boolean;
    /**
     * Specify which IP addresses the server should listen on.
     * Set to 0.0.0.0 to listen on all addresses, including LAN and public addresses.
     */
    host?: string | boolean;
    /**
     * Enable TLS + HTTP/2.
     * Note: this downgrades to TLS only when the proxy option is also used.
     */
    https?: boolean | HttpsServerOptions;
    /**
     * Open browser window on startup
     */
    open?: boolean | string;
    /**
     * Configure custom proxy rules for the dev server. Expects an object
     * of `{ key: options }` pairs.
     * Uses [`http-proxy`](https://github.com/http-party/node-http-proxy).
     * Full options [here](https://github.com/http-party/node-http-proxy#options).
     *
     * Example `vite.config.js`:
     * ``` js
     * module.exports = {
     *   proxy: {
     *     // string shorthand
     *     '/foo': 'http://localhost:4567/foo',
     *     // with options
     *     '/api': {
     *       target: 'http://jsonplaceholder.typicode.com',
     *       changeOrigin: true,
     *       rewrite: path => path.replace(/^\/api/, '')
     *     }
     *   }
     * }
     * ```
     */
    proxy?: Record<string, string | ProxyOptions>;
    /**
     * Configure CORS for the dev server.
     * Uses https://github.com/expressjs/cors.
     * Set to `true` to allow all methods from any origin, or configure separately
     * using an object.
     */
    cors?: CorsOptions | boolean;
}
/**
 * https://github.com/expressjs/cors#configuration-options
 */
export interface CorsOptions {
    origin?: CorsOrigin | ((origin: string, cb: (err: Error, origins: CorsOrigin) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}
export declare type CorsOrigin = boolean | string | RegExp | (string | RegExp)[];
export declare function resolveHttpServer({ proxy }: CommonServerOptions, app: Connect.Server, httpsOptions?: HttpsServerOptions): Promise<HttpServer>;
export declare function resolveHttpsConfig(https?: boolean | HttpsServerOptions, cacheDir?: string): Promise<HttpsServerOptions | undefined>;
export declare function httpServerStart(httpServer: HttpServer, serverOptions: {
    port: number;
    strictPort: boolean | undefined;
    host: string | undefined;
    logger: Logger;
}): Promise<number>;
