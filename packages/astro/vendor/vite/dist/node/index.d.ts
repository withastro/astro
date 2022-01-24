/// <reference types="node" />

import { Agent } from 'http';
import { BuildOptions as BuildOptions_2 } from 'esbuild';
import { ClientRequest } from 'http';
import { ClientRequestArgs } from 'http';
import { CustomPluginOptions } from 'rollup';
import { Duplex } from 'stream';
import { DuplexOptions } from 'stream';
import { TransformOptions as EsbuildTransformOptions } from 'esbuild';
import { EventEmitter } from 'events';
import * as events from 'events';
import * as fs from 'fs';
import * as http from 'http';
import { IncomingMessage } from 'http';
import { InputOptions } from 'rollup';
import { LoadResult } from 'rollup';
import { ModuleFormat } from 'rollup';
import { ModuleInfo } from 'rollup';
import * as net from 'net';
import { OutgoingHttpHeaders } from 'http';
import { OutputBundle } from 'rollup';
import { OutputChunk } from 'rollup';
import { PartialResolvedId } from 'rollup';
import { Plugin as Plugin_2 } from 'rollup';
import { PluginContext } from 'rollup';
import { PluginHooks } from 'rollup';
import * as Postcss from 'postcss';
import { ResolveIdResult } from 'rollup';
import { RollupError } from 'rollup';
import { RollupOptions } from 'rollup';
import { RollupOutput } from 'rollup';
import { RollupWatcher } from 'rollup';
import { SecureContextOptions } from 'tls';
import { Server } from 'http';
import { Server as Server_2 } from 'https';
import { Server as Server_3 } from 'net';
import { ServerOptions as ServerOptions_2 } from 'https';
import { ServerResponse } from 'http';
import { SourceDescription } from 'rollup';
import { SourceMap } from 'rollup';
import * as stream from 'stream';
import { TransformPluginContext } from 'rollup';
import { TransformResult as TransformResult_2 } from 'esbuild';
import { TransformResult as TransformResult_3 } from 'rollup';
import { URL } from 'url';
import * as url from 'url';
import { WatcherOptions } from 'rollup';
import { ZlibOptions } from 'zlib';

export declare interface Alias {
    find: string | RegExp
    replacement: string
    /**
     * Instructs the plugin to use an alternative resolving algorithm,
     * rather than the Rollup's resolver.
     * @default null
     */
    customResolver?: ResolverFunction | ResolverObject | null
}

/**
 * Specifies an `Object`, or an `Array` of `Object`,
 * which defines aliases used to replace values in `import` or `require` statements.
 * With either format, the order of the entries is important,
 * in that the first defined rules are applied first.
 *
 * This is passed to \@rollup/plugin-alias as the "entries" field
 * https://github.com/rollup/plugins/tree/master/packages/alias#entries
 */
export declare type AliasOptions = readonly Alias[] | { [find: string]: string }

export declare type AnymatchFn = (testString: string) => boolean

export declare type AnymatchPattern = string | RegExp | AnymatchFn

/**
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export declare function build(inlineConfig?: InlineConfig): Promise<RollupOutput | RollupOutput[] | RollupWatcher>;

export declare interface BuildOptions {
    /**
     * Base public path when served in production.
     * @deprecated `base` is now a root-level config option.
     */
    base?: string;
    /**
     * Compatibility transform target. The transform is performed with esbuild
     * and the lowest supported target is es2015/es6. Note this only handles
     * syntax transformation and does not cover polyfills (except for dynamic
     * import)
     *
     * Default: 'modules' - Similar to `@babel/preset-env`'s targets.esmodules,
     * transpile targeting browsers that natively support dynamic es module imports.
     * https://caniuse.com/es6-module-dynamic-import
     *
     * Another special value is 'esnext' - which only performs minimal transpiling
     * (for minification compat) and assumes native dynamic imports support.
     *
     * For custom targets, see https://esbuild.github.io/api/#target and
     * https://esbuild.github.io/content-types/#javascript for more details.
     */
    target?: 'modules' | EsbuildTransformOptions['target'] | false;
    /**
     * whether to inject module preload polyfill.
     * Note: does not apply to library mode.
     * @default true
     */
    polyfillModulePreload?: boolean;
    /**
     * whether to inject dynamic import polyfill.
     * Note: does not apply to library mode.
     * @default false
     * @deprecated use plugin-legacy for browsers that don't support dynamic import
     */
    polyfillDynamicImport?: boolean;
    /**
     * Directory relative from `root` where build output will be placed. If the
     * directory exists, it will be removed before the build.
     * @default 'dist'
     */
    outDir?: string;
    /**
     * Directory relative from `outDir` where the built js/css/image assets will
     * be placed.
     * @default 'assets'
     */
    assetsDir?: string;
    /**
     * Static asset files smaller than this number (in bytes) will be inlined as
     * base64 strings. Default limit is `4096` (4kb). Set to `0` to disable.
     * @default 4096
     */
    assetsInlineLimit?: number;
    /**
     * Whether to code-split CSS. When enabled, CSS in async chunks will be
     * inlined as strings in the chunk and inserted via dynamically created
     * style tags when the chunk is loaded.
     * @default true
     */
    cssCodeSplit?: boolean;
    /**
     * An optional separate target for CSS minification.
     * As esbuild only supports configuring targets to mainstream
     * browsers, users may need this option when they are targeting
     * a niche browser that comes with most modern JavaScript features
     * but has poor CSS support, e.g. Android WeChat WebView, which
     * doesn't support the #RGBA syntax.
     */
    cssTarget?: EsbuildTransformOptions['target'] | false;
    /**
     * If `true`, a separate sourcemap file will be created. If 'inline', the
     * sourcemap will be appended to the resulting output file as data URI.
     * 'hidden' works like `true` except that the corresponding sourcemap
     * comments in the bundled files are suppressed.
     * @default false
     */
    sourcemap?: boolean | 'inline' | 'hidden';
    /**
     * Set to `false` to disable minification, or specify the minifier to use.
     * Available options are 'terser' or 'esbuild'.
     * @default 'esbuild'
     */
    minify?: boolean | 'terser' | 'esbuild';
    /**
     * Options for terser
     * https://terser.org/docs/api-reference#minify-options
     */
    terserOptions?: Terser.MinifyOptions;
    /**
     * @deprecated Vite now uses esbuild for CSS minification.
     */
    cleanCssOptions?: any;
    /**
     * Will be merged with internal rollup options.
     * https://rollupjs.org/guide/en/#big-list-of-options
     */
    rollupOptions?: RollupOptions;
    /**
     * Options to pass on to `@rollup/plugin-commonjs`
     */
    commonjsOptions?: RollupCommonJSOptions;
    /**
     * Options to pass on to `@rollup/plugin-dynamic-import-vars`
     */
    dynamicImportVarsOptions?: RollupDynamicImportVarsOptions;
    /**
     * Whether to write bundle to disk
     * @default true
     */
    write?: boolean;
    /**
     * Empty outDir on write.
     * @default true when outDir is a sub directory of project root
     */
    emptyOutDir?: boolean | null;
    /**
     * Whether to emit a manifest.json under assets dir to map hash-less filenames
     * to their hashed versions. Useful when you want to generate your own HTML
     * instead of using the one generated by Vite.
     *
     * Example:
     *
     * ```json
     * {
     *   "main.js": {
     *     "file": "main.68fe3fad.js",
     *     "css": "main.e6b63442.css",
     *     "imports": [...],
     *     "dynamicImports": [...]
     *   }
     * }
     * ```
     * @default false
     */
    manifest?: boolean;
    /**
     * Build in library mode. The value should be the global name of the lib in
     * UMD mode. This will produce esm + cjs + umd bundle formats with default
     * configurations that are suitable for distributing libraries.
     */
    lib?: LibraryOptions | false;
    /**
     * Produce SSR oriented build. Note this requires specifying SSR entry via
     * `rollupOptions.input`.
     */
    ssr?: boolean | string;
    /**
     * Generate SSR manifest for determining style links and asset preload
     * directives in production.
     */
    ssrManifest?: boolean;
    /**
     * Set to false to disable reporting compressed chunk sizes.
     * Can slightly improve build speed.
     */
    reportCompressedSize?: boolean;
    /**
     * Set to false to disable brotli compressed size reporting for build.
     * Can slightly improve build speed.
     * @deprecated use `build.reportCompressedSize` instead.
     */
    brotliSize?: boolean;
    /**
     * Adjust chunk size warning limit (in kbs).
     * @default 500
     */
    chunkSizeWarningLimit?: number;
    /**
     * Rollup watch options
     * https://rollupjs.org/guide/en/#watchoptions
     */
    watch?: WatcherOptions | null;
}

export declare interface CommonServerOptions {
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
    https?: boolean | ServerOptions_2;
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

export declare interface ConfigEnv {
    command: 'build' | 'serve';
    mode: string;
}

export declare namespace Connect {
    export type ServerHandle = HandleFunction | http.Server

    export class IncomingMessage extends http.IncomingMessage {
        originalUrl?: http.IncomingMessage['url']
    }

    export type NextFunction = (err?: any) => void

    export type SimpleHandleFunction = (
    req: IncomingMessage,
    res: http.ServerResponse
    ) => void
    export type NextHandleFunction = (
    req: IncomingMessage,
    res: http.ServerResponse,
    next: NextFunction
    ) => void
    export type ErrorHandleFunction = (
    err: any,
    req: IncomingMessage,
    res: http.ServerResponse,
    next: NextFunction
    ) => void
    export type HandleFunction =
    | SimpleHandleFunction
    | NextHandleFunction
    | ErrorHandleFunction

    export interface ServerStackItem {
        route: string
        handle: ServerHandle
    }

    export interface Server extends NodeJS.EventEmitter {
        (req: http.IncomingMessage, res: http.ServerResponse, next?: Function): void

        route: string
        stack: ServerStackItem[]

        /**
         * Utilize the given middleware `handle` to the given `route`,
         * defaulting to _/_. This "route" is the mount-point for the
         * middleware, when given a value other than _/_ the middleware
         * is only effective when that segment is present in the request's
         * pathname.
         *
         * For example if we were to mount a function at _/admin_, it would
         * be invoked on _/admin_, and _/admin/settings_, however it would
         * not be invoked for _/_, or _/posts_.
         */
        use(fn: NextHandleFunction): Server
        use(fn: HandleFunction): Server
        use(route: string, fn: NextHandleFunction): Server
        use(route: string, fn: HandleFunction): Server

        /**
         * Handle server requests, punting them down
         * the middleware stack.
         */
        handle(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        next: Function
        ): void

        /**
         * Listen for connections.
         *
         * This method takes the same arguments
         * as node's `http.Server#listen()`.
         *
         * HTTP and HTTPS:
         *
         * If you run your application both as HTTP
         * and HTTPS you may wrap them individually,
         * since your Connect "server" is really just
         * a JavaScript `Function`.
         *
         *      var connect = require('connect')
         *        , http = require('http')
         *        , https = require('https');
         *
         *      var app = connect();
         *
         *      http.createServer(app).listen(80);
         *      https.createServer(options, app).listen(443);
         */
        listen(
        port: number,
        hostname?: string,
        backlog?: number,
        callback?: Function
        ): http.Server
        listen(port: number, hostname?: string, callback?: Function): http.Server
        listen(path: string, callback?: Function): http.Server
        listen(handle: any, listeningListener?: Function): http.Server
    }
}

export declare interface ConnectedPayload {
    type: 'connected'
}

/**
 * https://github.com/expressjs/cors#configuration-options
 */
export declare interface CorsOptions {
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

export declare function createLogger(level?: LogLevel, options?: LoggerOptions): Logger;

export declare function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>;

export declare interface CSSModulesOptions {
    getJSON?: (cssFileName: string, json: Record<string, string>, outputFileName: string) => void;
    scopeBehaviour?: 'global' | 'local';
    globalModulePaths?: RegExp[];
    generateScopedName?: string | ((name: string, filename: string, css: string) => string);
    hashPrefix?: string;
    /**
     * default: null
     */
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly' | null;
}

export declare interface CSSOptions {
    /**
     * https://github.com/css-modules/postcss-modules
     */
    modules?: CSSModulesOptions | false;
    preprocessorOptions?: Record<string, any>;
    postcss?: string | (Postcss.ProcessOptions & {
        plugins?: Postcss.Plugin[];
    });
}

export declare interface CustomPayload {
    type: 'custom'
    event: string
    data?: any
}

/**
 * Type helper to make it easier to use vite.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 * `command` (either `'build'` or `'serve'`), and `mode`.
 */
export declare function defineConfig(config: UserConfigExport): UserConfigExport;

export declare interface DepOptimizationMetadata {
    /**
     * The main hash is determined by user config and dependency lockfiles.
     * This is checked on server startup to avoid unnecessary re-bundles.
     */
    hash: string;
    /**
     * The browser hash is determined by the main hash plus additional dependencies
     * discovered at runtime. This is used to invalidate browser requests to
     * optimized deps.
     */
    browserHash: string;
    optimized: Record<string, {
        file: string;
        src: string;
        needsInterop: boolean;
    }>;
}

export declare interface DepOptimizationOptions {
    /**
     * By default, Vite will crawl your index.html to detect dependencies that
     * need to be pre-bundled. If build.rollupOptions.input is specified, Vite
     * will crawl those entry points instead.
     *
     * If neither of these fit your needs, you can specify custom entries using
     * this option - the value should be a fast-glob pattern or array of patterns
     * (https://github.com/mrmlnc/fast-glob#basic-syntax) that are relative from
     * vite project root. This will overwrite default entries inference.
     */
    entries?: string | string[];
    /**
     * Force optimize listed dependencies (must be resolvable import paths,
     * cannot be globs).
     */
    include?: string[];
    /**
     * Do not optimize these dependencies (must be resolvable import paths,
     * cannot be globs).
     */
    exclude?: string[];
    /**
     * Options to pass to esbuild during the dep scanning and optimization
     *
     * Certain options are omitted since changing them would not be compatible
     * with Vite's dep optimization.
     *
     * - `external` is also omitted, use Vite's `optimizeDeps.exclude` option
     * - `plugins` are merged with Vite's dep plugin
     * - `keepNames` takes precedence over the deprecated `optimizeDeps.keepNames`
     *
     * https://esbuild.github.io/api
     */
    esbuildOptions?: Omit<BuildOptions_2, 'bundle' | 'entryPoints' | 'external' | 'write' | 'watch' | 'outdir' | 'outfile' | 'outbase' | 'outExtension' | 'metafile'>;
    /**
     * @deprecated use `esbuildOptions.keepNames`
     */
    keepNames?: boolean;
}

export declare interface ErrorPayload {
    type: 'error'
    err: {
        [name: string]: any
        message: string
        stack: string
        id?: string
        frame?: string
        plugin?: string
        pluginCode?: string
        loc?: {
            file?: string
            line: number
            column: number
        }
    }
}

export declare interface ESBuildOptions extends EsbuildTransformOptions {
    include?: string | RegExp | string[] | RegExp[];
    exclude?: string | RegExp | string[] | RegExp[];
    jsxInject?: string;
}

export { EsbuildTransformOptions }

export declare type ESBuildTransformResult = Omit<TransformResult_2, 'map'> & {
    map: SourceMap;
};

export declare interface FileSystemServeOptions {
    /**
     * Strictly restrict file accessing outside of allowing paths.
     *
     * Set to `false` to disable the warning
     *
     * @default true
     */
    strict?: boolean;
    /**
     * Restrict accessing files outside the allowed directories.
     *
     * Accepts absolute path or a path relative to project root.
     * Will try to search up for workspace root by default.
     */
    allow?: string[];
    /**
     * Restrict accessing files that matches the patterns.
     *
     * This will have higher priority than `allow`.
     * Glob patterns are supported.
     *
     * @default ['.env', '.env.*', '*.crt', '*.pem']
     *
     * @experimental
     */
    deny?: string[];
}

export declare interface FSWatcher extends fs.FSWatcher {
    options: WatchOptions

    /**
     * Constructs a new FSWatcher instance with optional WatchOptions parameter.
     */
    (options?: WatchOptions): void

    /**
     * Add files, directories, or glob patterns for tracking. Takes an array of strings or just one
     * string.
     */
    add(paths: string | ReadonlyArray<string>): void

    /**
     * Stop watching files, directories, or glob patterns. Takes an array of strings or just one
     * string.
     */
    unwatch(paths: string | ReadonlyArray<string>): void

    /**
     * Returns an object representing all the paths on the file system being watched by this
     * `FSWatcher` instance. The object's keys are all the directories (using absolute paths unless
     * the `cwd` option was used), and the values are arrays of the names of the items contained in
     * each directory.
     */
    getWatched(): {
        [directory: string]: string[]
    }

    /**
     * Removes all listeners from watched files.
     */
    close(): Promise<void>

    on(
    event: 'add' | 'addDir' | 'change',
    listener: (path: string, stats?: fs.Stats) => void
    ): this

    on(
    event: 'all',
    listener: (
    eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
    path: string,
    stats?: fs.Stats
    ) => void
    ): this

    /**
     * Error occurred
     */
    on(event: 'error', listener: (error: Error) => void): this

    /**
     * Exposes the native Node `fs.FSWatcher events`
     */
    on(
    event: 'raw',
    listener: (eventName: string, path: string, details: any) => void
    ): this

    /**
     * Fires when the initial scan is complete
     */
    on(event: 'ready', listener: () => void): this

    on(event: 'unlink' | 'unlinkDir', listener: (path: string) => void): this

    on(event: string, listener: (...args: any[]) => void): this
}

export declare interface FullReloadPayload {
    type: 'full-reload'
    path?: string
}

export declare interface HmrContext {
    file: string;
    timestamp: number;
    modules: Array<ModuleNode>;
    read: () => string | Promise<string>;
    server: ViteDevServer;
}

export declare interface HmrOptions {
    protocol?: string;
    host?: string;
    port?: number;
    clientPort?: number;
    path?: string;
    timeout?: number;
    overlay?: boolean;
    server?: Server;
}

export declare type HMRPayload =
| ConnectedPayload
| UpdatePayload
| FullReloadPayload
| CustomPayload
| ErrorPayload
| PrunePayload

export declare interface HtmlTagDescriptor {
    tag: string;
    attrs?: Record<string, string | boolean | undefined>;
    children?: string | HtmlTagDescriptor[];
    /**
     * default: 'head-prepend'
     */
    injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
}

export declare namespace HttpProxy {
    export type ProxyTarget = ProxyTargetUrl | ProxyTargetDetailed

    export type ProxyTargetUrl = string | Partial<url.Url>

    export interface ProxyTargetDetailed {
        host: string
        port: number
        protocol?: string
        hostname?: string
        socketPath?: string
        key?: string
        passphrase?: string
        pfx?: Buffer | string
        cert?: string
        ca?: string
        ciphers?: string
        secureProtocol?: string
    }

    export type ErrorCallback = (
    err: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    target?: ProxyTargetUrl
    ) => void

    export class Server extends events.EventEmitter {
        /**
         * Creates the proxy server with specified options.
         * @param options - Config object passed to the proxy
         */
        constructor(options?: ServerOptions)

        /**
         * Used for proxying regular HTTP(S) requests
         * @param req - Client request.
         * @param res - Client response.
         * @param options - Additionnal options.
         */
        web(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        options?: ServerOptions,
        callback?: ErrorCallback
        ): void

        /**
         * Used for proxying regular HTTP(S) requests
         * @param req - Client request.
         * @param socket - Client socket.
         * @param head - Client head.
         * @param options - Additional options.
         */
        ws(
        req: http.IncomingMessage,
        socket: unknown,
        head: unknown,
        options?: ServerOptions,
        callback?: ErrorCallback
        ): void

        /**
         * A function that wraps the object in a webserver, for your convenience
         * @param port - Port to listen on
         */
        listen(port: number): Server

        /**
         * A function that closes the inner webserver and stops listening on given port
         */
        close(callback?: () => void): void

        /**
         * Creates the proxy server with specified options.
         * @param options - Config object passed to the proxy
         * @returns Proxy object with handlers for `ws` and `web` requests
         */
        static createProxyServer(options?: ServerOptions): Server

        /**
         * Creates the proxy server with specified options.
         * @param options - Config object passed to the proxy
         * @returns Proxy object with handlers for `ws` and `web` requests
         */
        static createServer(options?: ServerOptions): Server

        /**
         * Creates the proxy server with specified options.
         * @param options - Config object passed to the proxy
         * @returns Proxy object with handlers for `ws` and `web` requests
         */
        static createProxy(options?: ServerOptions): Server

        addListener(event: string, listener: () => void): this
        on(event: string, listener: () => void): this
        on(event: 'error', listener: ErrorCallback): this
        on(
        event: 'start',
        listener: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target: ProxyTargetUrl
        ) => void
        ): this
        on(
        event: 'proxyReq',
        listener: (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        options: ServerOptions
        ) => void
        ): this
        on(
        event: 'proxyRes',
        listener: (
        proxyRes: http.IncomingMessage,
        req: http.IncomingMessage,
        res: http.ServerResponse
        ) => void
        ): this
        on(
        event: 'proxyReqWs',
        listener: (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        socket: net.Socket,
        options: ServerOptions,
        head: any
        ) => void
        ): this
        on(
        event: 'econnreset',
        listener: (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target: ProxyTargetUrl
        ) => void
        ): this
        on(
        event: 'end',
        listener: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
        proxyRes: http.IncomingMessage
        ) => void
        ): this
        on(
        event: 'close',
        listener: (
        proxyRes: http.IncomingMessage,
        proxySocket: net.Socket,
        proxyHead: any
        ) => void
        ): this

        once(event: string, listener: () => void): this
        removeListener(event: string, listener: () => void): this
        removeAllListeners(event?: string): this
        getMaxListeners(): number
        setMaxListeners(n: number): this
        listeners(event: string): Array<() => void>
        emit(event: string, ...args: any[]): boolean
        listenerCount(type: string): number
    }

    export interface ServerOptions {
        /** URL string to be parsed with the url module. */
        target?: ProxyTarget
        /** URL string to be parsed with the url module. */
        forward?: ProxyTargetUrl
        /** Object to be passed to http(s).request. */
        agent?: any
        /** Object to be passed to https.createServer(). */
        ssl?: any
        /** If you want to proxy websockets. */
        ws?: boolean
        /** Adds x- forward headers. */
        xfwd?: boolean
        /** Verify SSL certificate. */
        secure?: boolean
        /** Explicitly specify if we are proxying to another proxy. */
        toProxy?: boolean
        /** Specify whether you want to prepend the target's path to the proxy path. */
        prependPath?: boolean
        /** Specify whether you want to ignore the proxy path of the incoming request. */
        ignorePath?: boolean
        /** Local interface string to bind for outgoing connections. */
        localAddress?: string
        /** Changes the origin of the host header to the target URL. */
        changeOrigin?: boolean
        /** specify whether you want to keep letter case of response header key */
        preserveHeaderKeyCase?: boolean
        /** Basic authentication i.e. 'user:password' to compute an Authorization header. */
        auth?: string
        /** Rewrites the location hostname on (301 / 302 / 307 / 308) redirects, Default: null. */
        hostRewrite?: string
        /** Rewrites the location host/ port on (301 / 302 / 307 / 308) redirects based on requested host/ port.Default: false. */
        autoRewrite?: boolean
        /** Rewrites the location protocol on (301 / 302 / 307 / 308) redirects to 'http' or 'https'.Default: null. */
        protocolRewrite?: string
        /** rewrites domain of set-cookie headers. */
        cookieDomainRewrite?: false | string | { [oldDomain: string]: string }
        /** rewrites path of set-cookie headers. Default: false */
        cookiePathRewrite?: false | string | { [oldPath: string]: string }
        /** object with extra headers to be added to target requests. */
        headers?: { [header: string]: string }
        /** Timeout (in milliseconds) when proxy receives no response from target. Default: 120000 (2 minutes) */
        proxyTimeout?: number
        /** Timeout (in milliseconds) for incoming requests */
        timeout?: number
        /** Specify whether you want to follow redirects. Default: false */
        followRedirects?: boolean
        /** If set to true, none of the webOutgoing passes are called and it's your responsibility to appropriately return the response by listening and acting on the proxyRes event */
        selfHandleResponse?: boolean
        /** Buffer */
        buffer?: stream.Stream
    }
}

export declare type IndexHtmlTransform = IndexHtmlTransformHook | {
    enforce?: 'pre' | 'post';
    transform: IndexHtmlTransformHook;
};

export declare interface IndexHtmlTransformContext {
    /**
     * public path when served
     */
    path: string;
    /**
     * filename on disk
     */
    filename: string;
    server?: ViteDevServer;
    bundle?: OutputBundle;
    chunk?: OutputChunk;
    originalUrl?: string;
}

export declare type IndexHtmlTransformHook = (html: string, ctx: IndexHtmlTransformContext) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>;

export declare type IndexHtmlTransformResult = string | HtmlTagDescriptor[] | {
    html: string;
    tags: HtmlTagDescriptor[];
};

export declare interface InlineConfig extends UserConfig {
    configFile?: string | false;
    envFile?: false;
}

export declare interface InternalResolveOptions extends ResolveOptions {
    root: string;
    isBuild: boolean;
    isProduction: boolean;
    ssrConfig?: SSROptions;
    packageCache?: PackageCache;
    /**
     * src code mode also attempts the following:
     * - resolving /xxx as URLs
     * - resolving bare imports from optimized deps
     */
    asSrc?: boolean;
    tryIndex?: boolean;
    tryPrefix?: string;
    skipPackageJson?: boolean;
    preferRelative?: boolean;
    preserveSymlinks?: boolean;
    isRequire?: boolean;
    isFromTsImporter?: boolean;
    tryEsmOnly?: boolean;
}

export declare interface JsonOptions {
    /**
     * Generate a named export for every property of the JSON object
     * @default true
     */
    namedExports?: boolean;
    /**
     * Generate performant output as JSON.parse("stringified").
     * Enabling this will disable namedExports.
     * @default false
     */
    stringify?: boolean;
}

export declare type LibraryFormats = 'es' | 'cjs' | 'umd' | 'iife';

export declare interface LibraryOptions {
    entry: string;
    name?: string;
    formats?: LibraryFormats[];
    fileName?: string | ((format: ModuleFormat) => string);
}

export declare function loadConfigFromFile(configEnv: ConfigEnv, configFile?: string, configRoot?: string, logLevel?: LogLevel): Promise<{
    path: string;
    config: UserConfig;
    dependencies: string[];
} | null>;

export declare function loadEnv(mode: string, envDir: string, prefixes?: string | string[]): Record<string, string>;

export declare interface LogErrorOptions extends LogOptions {
    error?: Error | RollupError | null;
}

export declare interface Logger {
    info(msg: string, options?: LogOptions): void;
    warn(msg: string, options?: LogOptions): void;
    warnOnce(msg: string, options?: LogOptions): void;
    error(msg: string, options?: LogErrorOptions): void;
    clearScreen(type: LogType): void;
    hasErrorLogged(error: Error | RollupError): boolean;
    hasWarned: boolean;
}

export declare interface LoggerOptions {
    prefix?: string;
    allowClearScreen?: boolean;
    customLogger?: Logger;
}

export declare type LogLevel = LogType | 'silent';

export declare interface LogOptions {
    clear?: boolean;
    timestamp?: boolean;
}

export declare type LogType = 'error' | 'warn' | 'info';

export declare type Manifest = Record<string, ManifestChunk>;

export declare interface ManifestChunk {
    src?: string;
    file: string;
    css?: string[];
    assets?: string[];
    isEntry?: boolean;
    isDynamicEntry?: boolean;
    imports?: string[];
    dynamicImports?: string[];
}

export declare type Matcher = AnymatchPattern | AnymatchPattern[]

export declare function mergeConfig(a: Record<string, any>, b: Record<string, any>, isRoot?: boolean): Record<string, any>;

export declare class ModuleGraph {
    private resolveId;
    urlToModuleMap: Map<string, ModuleNode>;
    idToModuleMap: Map<string, ModuleNode>;
    fileToModulesMap: Map<string, Set<ModuleNode>>;
    safeModulesPath: Set<string>;
    constructor(resolveId: (url: string) => Promise<PartialResolvedId | null>);
    getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined>;
    getModuleById(id: string): ModuleNode | undefined;
    getModulesByFile(file: string): Set<ModuleNode> | undefined;
    onFileChange(file: string): void;
    invalidateModule(mod: ModuleNode, seen?: Set<ModuleNode>): void;
    invalidateAll(): void;
    /**
     * Update the module graph based on a module's updated imports information
     * If there are dependencies that no longer have any importers, they are
     * returned as a Set.
     */
    updateModuleInfo(mod: ModuleNode, importedModules: Set<string | ModuleNode>, acceptedModules: Set<string | ModuleNode>, isSelfAccepting: boolean): Promise<Set<ModuleNode> | undefined>;
    ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode>;
    createFileOnlyEntry(file: string): ModuleNode;
    resolveUrl(url: string): Promise<ResolvedUrl>;
}

export declare class ModuleNode {
    /**
     * Public served url path, starts with /
     */
    url: string;
    /**
     * Resolved file system path + query
     */
    id: string | null;
    file: string | null;
    type: 'js' | 'css';
    info?: ModuleInfo;
    meta?: Record<string, any>;
    importers: Set<ModuleNode>;
    importedModules: Set<ModuleNode>;
    acceptedHmrDeps: Set<ModuleNode>;
    isSelfAccepting: boolean;
    transformResult: TransformResult | null;
    ssrTransformResult: TransformResult | null;
    ssrModule: Record<string, any> | null;
    lastHMRTimestamp: number;
    constructor(url: string);
}

export declare function normalizePath(id: string): string;

export declare function optimizeDeps(config: ResolvedConfig, force?: boolean | undefined, asCommand?: boolean, newDeps?: Record<string, string>, // missing imports encountered after server has started
ssr?: boolean): Promise<DepOptimizationMetadata | null>;

/** Cache for package.json resolution and package.json contents */
export declare type PackageCache = Map<string, PackageData>;

export declare interface PackageData {
    dir: string;
    hasSideEffects: (id: string) => boolean | 'no-treeshake';
    webResolvedImports: Record<string, string | undefined>;
    nodeResolvedImports: Record<string, string | undefined>;
    setResolvedCache: (key: string, entry: string, targetWeb: boolean) => void;
    getResolvedCache: (key: string, targetWeb: boolean) => string | undefined;
    data: {
        [field: string]: any;
        version: string;
        main: string;
        module: string;
        browser: string | Record<string, string | false>;
        exports: string | Record<string, any> | string[];
        dependencies: Record<string, string>;
    };
}

/**
 * Vite plugins extends the Rollup plugin interface with a few extra
 * vite-specific options. A valid vite plugin is also a valid Rollup plugin.
 * On the contrary, a Rollup plugin may or may NOT be a valid vite universal
 * plugin, since some Rollup features do not make sense in an unbundled
 * dev server context. That said, as long as a rollup plugin doesn't have strong
 * coupling between its bundle phase and output phase hooks then it should
 * just work (that means, most of them).
 *
 * By default, the plugins are run during both serve and build. When a plugin
 * is applied during serve, it will only run **non output plugin hooks** (see
 * rollup type definition of {@link rollup#PluginHooks}). You can think of the
 * dev server as only running `const bundle = rollup.rollup()` but never calling
 * `bundle.generate()`.
 *
 * A plugin that expects to have different behavior depending on serve/build can
 * export a factory function that receives the command being run via options.
 *
 * If a plugin should be applied only for server or build, a function format
 * config file can be used to conditional determine the plugins to use.
 */
export declare interface Plugin extends Plugin_2 {
    /**
     * Enforce plugin invocation tier similar to webpack loaders.
     *
     * Plugin invocation order:
     * - alias resolution
     * - `enforce: 'pre'` plugins
     * - vite core plugins
     * - normal plugins
     * - vite build plugins
     * - `enforce: 'post'` plugins
     * - vite build post plugins
     */
    enforce?: 'pre' | 'post';
    /**
     * Apply the plugin only for serve or build, or on certain conditions.
     */
    apply?: 'serve' | 'build' | ((config: UserConfig, env: ConfigEnv) => boolean);
    /**
     * Modify vite config before it's resolved. The hook can either mutate the
     * passed-in config directly, or return a partial config object that will be
     * deeply merged into existing config.
     *
     * Note: User plugins are resolved before running this hook so injecting other
     * plugins inside  the `config` hook will have no effect.
     */
    config?: (config: UserConfig, env: ConfigEnv) => UserConfig | null | void | Promise<UserConfig | null | void>;
    /**
     * Use this hook to read and store the final resolved vite config.
     */
    configResolved?: (config: ResolvedConfig) => void | Promise<void>;
    /**
     * Configure the vite server. The hook receives the {@link ViteDevServer}
     * instance. This can also be used to store a reference to the server
     * for use in other hooks.
     *
     * The hooks will be called before internal middlewares are applied. A hook
     * can return a post hook that will be called after internal middlewares
     * are applied. Hook can be async functions and will be called in series.
     */
    configureServer?: ServerHook;
    /**
     * Transform index.html.
     * The hook receives the following arguments:
     *
     * - html: string
     * - ctx?: vite.ServerContext (only present during serve)
     * - bundle?: rollup.OutputBundle (only present during build)
     *
     * It can either return a transformed string, or a list of html tag
     * descriptors that will be injected into the <head> or <body>.
     *
     * By default the transform is applied **after** vite's internal html
     * transform. If you need to apply the transform before vite, use an object:
     * `{ enforce: 'pre', transform: hook }`
     */
    transformIndexHtml?: IndexHtmlTransform;
    /**
     * Perform custom handling of HMR updates.
     * The handler receives a context containing changed filename, timestamp, a
     * list of modules affected by the file change, and the dev server instance.
     *
     * - The hook can return a filtered list of modules to narrow down the update.
     *   e.g. for a Vue SFC, we can narrow down the part to update by comparing
     *   the descriptors.
     *
     * - The hook can also return an empty array and then perform custom updates
     *   by sending a custom hmr payload via server.ws.send().
     *
     * - If the hook doesn't return a value, the hmr update will be performed as
     *   normal.
     */
    handleHotUpdate?(ctx: HmrContext): Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>;
    /**
     * extend hooks with ssr flag
     */
    resolveId?(this: PluginContext, source: string, importer: string | undefined, options: {
        custom?: CustomPluginOptions;
        ssr?: boolean;
    }): Promise<ResolveIdResult> | ResolveIdResult;
    load?(this: PluginContext, id: string, options?: {
        ssr?: boolean;
    }): Promise<LoadResult> | LoadResult;
    transform?(this: TransformPluginContext, code: string, id: string, options?: {
        ssr?: boolean;
    }): Promise<TransformResult_3> | TransformResult_3;
}

export declare interface PluginContainer {
    options: InputOptions;
    getModuleInfo(id: string): ModuleInfo | null;
    buildStart(options: InputOptions): Promise<void>;
    resolveId(id: string, importer?: string, options?: {
        skip?: Set<Plugin>;
        ssr?: boolean;
    }): Promise<PartialResolvedId | null>;
    transform(code: string, id: string, options?: {
        inMap?: SourceDescription['map'];
        ssr?: boolean;
    }): Promise<SourceDescription | null>;
    load(id: string, options?: {
        ssr?: boolean;
    }): Promise<LoadResult | null>;
    close(): Promise<void>;
}

export declare type PluginOption = Plugin | false | null | undefined;

/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 * @param config - the resolved Vite config
 * @param serverOptions - what host and port to use
 * @experimental
 */
export declare function preview(inlineConfig: InlineConfig): Promise<PreviewServer>;

export declare interface PreviewOptions extends CommonServerOptions {
}

export declare interface PreviewServer {
    /**
     * The resolved vite config object
     */
    config: ResolvedConfig;
    /**
     * native Node http server instance
     */
    httpServer: Server;
    /**
     * Print server urls
     */
    printUrls: () => void;
}

/**
 * @deprecated Use `server.printUrls()` instead
 */
export declare function printHttpServerUrls(server: Server_3, config: ResolvedConfig): void;

export declare interface ProxyOptions extends HttpProxy.ServerOptions {
    /**
     * rewrite path
     */
    rewrite?: (path: string) => string;
    /**
     * configure the proxy server (e.g. listen to events)
     */
    configure?: (proxy: HttpProxy.Server, options: ProxyOptions) => void;
    /**
     * webpack-dev-server style bypass function
     */
    bypass?: (req: http.IncomingMessage, res: http.ServerResponse, options: ProxyOptions) => void | null | undefined | false | string;
}

export declare interface PrunePayload {
    type: 'prune'
    paths: string[]
}

export declare function resolveConfig(inlineConfig: InlineConfig, command: 'build' | 'serve', defaultMode?: string): Promise<ResolvedConfig>;

export declare type ResolvedBuildOptions = Required<Omit<BuildOptions, 'base' | 'cleanCssOptions' | 'polyfillDynamicImport' | 'brotliSize'>>;

export declare type ResolvedConfig = Readonly<Omit<UserConfig, 'plugins' | 'alias' | 'dedupe' | 'assetsInclude' | 'optimizeDeps'> & {
    configFile: string | undefined;
    configFileDependencies: string[];
    inlineConfig: InlineConfig;
    root: string;
    base: string;
    publicDir: string;
    command: 'build' | 'serve';
    mode: string;
    isProduction: boolean;
    env: Record<string, any>;
    resolve: ResolveOptions & {
        alias: Alias[];
    };
    plugins: readonly Plugin[];
    server: ResolvedServerOptions;
    build: ResolvedBuildOptions;
    preview: ResolvedPreviewOptions;
    assetsInclude: (file: string) => boolean;
    logger: Logger;
    createResolver: (options?: Partial<InternalResolveOptions>) => ResolveFn;
    optimizeDeps: Omit<DepOptimizationOptions, 'keepNames'>;
    /* Excluded from this release type: packageCache */
}>;

export declare interface ResolvedPreviewOptions extends PreviewOptions {
}

export declare interface ResolvedServerOptions extends ServerOptions {
    fs: Required<FileSystemServeOptions>;
}

export declare type ResolvedUrl = [
url: string,
resolvedId: string,
meta: object | null | undefined
];

export declare function resolveEnvPrefix({ envPrefix }: UserConfig): string[];

export declare type ResolveFn = (id: string, importer?: string, aliasOnly?: boolean, ssr?: boolean) => Promise<string | undefined>;

export declare interface ResolveOptions {
    mainFields?: string[];
    conditions?: string[];
    extensions?: string[];
    dedupe?: string[];
    preserveSymlinks?: boolean;
}

export declare function resolvePackageData(id: string, basedir: string, preserveSymlinks?: boolean, packageCache?: PackageCache): PackageData | null;

export declare function resolvePackageEntry(id: string, { dir, data, setResolvedCache, getResolvedCache }: PackageData, targetWeb: boolean, options: InternalResolveOptions): string | undefined;

export declare type ResolverFunction = PluginHooks['resolveId']

export declare interface ResolverObject {
    buildStart?: PluginHooks['buildStart']
    resolveId: ResolverFunction
}

/**
 * https://github.com/rollup/plugins/blob/master/packages/commonjs/types/index.d.ts
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/rollup/plugins/blob/master/LICENSE
 */
export declare interface RollupCommonJSOptions {
    /**
     * A picomatch pattern, or array of patterns, which specifies the files in
     * the build the plugin should operate on. By default, all files with
     * extension `".cjs"` or those in `extensions` are included, but you can narrow
     * this list by only including specific files. These files will be analyzed
     * and transpiled if either the analysis does not find ES module specific
     * statements or `transformMixedEsModules` is `true`.
     * @default undefined
     */
    include?: string | RegExp | readonly (string | RegExp)[]
    /**
     * A picomatch pattern, or array of patterns, which specifies the files in
     * the build the plugin should _ignore_. By default, all files with
     * extensions other than those in `extensions` or `".cjs"` are ignored, but you
     * can exclude additional files. See also the `include` option.
     * @default undefined
     */
    exclude?: string | RegExp | readonly (string | RegExp)[]
    /**
     * For extensionless imports, search for extensions other than .js in the
     * order specified. Note that you need to make sure that non-JavaScript files
     * are transpiled by another plugin first.
     * @default [ '.js' ]
     */
    extensions?: ReadonlyArray<string>
    /**
     * If true then uses of `global` won't be dealt with by this plugin
     * @default false
     */
    ignoreGlobal?: boolean
    /**
     * If false, skips source map generation for CommonJS modules. This will improve performance.
     * @default true
     */
    sourceMap?: boolean
    /**
     * Some `require` calls cannot be resolved statically to be translated to
     * imports.
     * When this option is set to `false`, the generated code will either
     * directly throw an error when such a call is encountered or, when
     * `dynamicRequireTargets` is used, when such a call cannot be resolved with a
     * configured dynamic require target.
     * Setting this option to `true` will instead leave the `require` call in the
     * code or use it as a fallback for `dynamicRequireTargets`.
     * @default false
     */
    ignoreDynamicRequires?: boolean
    /**
     * Instructs the plugin whether to enable mixed module transformations. This
     * is useful in scenarios with modules that contain a mix of ES `import`
     * statements and CommonJS `require` expressions. Set to `true` if `require`
     * calls should be transformed to imports in mixed modules, or `false` if the
     * `require` expressions should survive the transformation. The latter can be
     * important if the code contains environment detection, or you are coding
     * for an environment with special treatment for `require` calls such as
     * ElectronJS. See also the `ignore` option.
     * @default false
     */
    transformMixedEsModules?: boolean
    /**
     * Sometimes you have to leave require statements unconverted. Pass an array
     * containing the IDs or a `id => boolean` function.
     * @default []
     */
    ignore?: ReadonlyArray<string> | ((id: string) => boolean)
    /**
     * In most cases, where `require` calls are inside a `try-catch` clause,
     * they should be left unconverted as it requires an optional dependency
     * that may or may not be installed beside the rolled up package.
     * Due to the conversion of `require` to a static `import` - the call is hoisted
     * to the top of the file, outside of the `try-catch` clause.
     *
     * - `true`: All `require` calls inside a `try` will be left unconverted.
     * - `false`: All `require` calls inside a `try` will be converted as if the `try-catch` clause is not there.
     * - `remove`: Remove all `require` calls from inside any `try` block.
     * - `string[]`: Pass an array containing the IDs to left unconverted.
     * - `((id: string) => boolean|'remove')`: Pass a function that control individual IDs.
     *
     * @default false
     */
    ignoreTryCatch?:
    | boolean
    | 'remove'
    | ReadonlyArray<string>
    | ((id: string) => boolean | 'remove')
    /**
     * Controls how to render imports from external dependencies. By default,
     * this plugin assumes that all external dependencies are CommonJS. This
     * means they are rendered as default imports to be compatible with e.g.
     * NodeJS where ES modules can only import a default export from a CommonJS
     * dependency.
     *
     * If you set `esmExternals` to `true`, this plugins assumes that all
     * external dependencies are ES modules and respect the
     * `requireReturnsDefault` option. If that option is not set, they will be
     * rendered as namespace imports.
     *
     * You can also supply an array of ids to be treated as ES modules, or a
     * function that will be passed each external id to determine if it is an ES
     * module.
     * @default false
     */
    esmExternals?: boolean | ReadonlyArray<string> | ((id: string) => boolean)
    /**
     * Controls what is returned when requiring an ES module from a CommonJS file.
     * When using the `esmExternals` option, this will also apply to external
     * modules. By default, this plugin will render those imports as namespace
     * imports i.e.
     *
     * ```js
     * // input
     * const foo = require('foo');
     *
     * // output
     * import * as foo from 'foo';
     * ```
     *
     * However there are some situations where this may not be desired.
     * For these situations, you can change Rollup's behaviour either globally or
     * per module. To change it globally, set the `requireReturnsDefault` option
     * to one of the following values:
     *
     * - `false`: This is the default, requiring an ES module returns its
     *   namespace. This is the only option that will also add a marker
     *   `__esModule: true` to the namespace to support interop patterns in
     *   CommonJS modules that are transpiled ES modules.
     * - `"namespace"`: Like `false`, requiring an ES module returns its
     *   namespace, but the plugin does not add the `__esModule` marker and thus
     *   creates more efficient code. For external dependencies when using
     *   `esmExternals: true`, no additional interop code is generated.
     * - `"auto"`: This is complementary to how `output.exports: "auto"` works in
     *   Rollup: If a module has a default export and no named exports, requiring
     *   that module returns the default export. In all other cases, the namespace
     *   is returned. For external dependencies when using `esmExternals: true`, a
     *   corresponding interop helper is added.
     * - `"preferred"`: If a module has a default export, requiring that module
     *   always returns the default export, no matter whether additional named
     *   exports exist. This is similar to how previous versions of this plugin
     *   worked. Again for external dependencies when using `esmExternals: true`,
     *   an interop helper is added.
     * - `true`: This will always try to return the default export on require
     *   without checking if it actually exists. This can throw at build time if
     *   there is no default export. This is how external dependencies are handled
     *   when `esmExternals` is not used. The advantage over the other options is
     *   that, like `false`, this does not add an interop helper for external
     *   dependencies, keeping the code lean.
     *
     * To change this for individual modules, you can supply a function for
     * `requireReturnsDefault` instead. This function will then be called once for
     * each required ES module or external dependency with the corresponding id
     * and allows you to return different values for different modules.
     * @default false
     */
    requireReturnsDefault?:
    | boolean
    | 'auto'
    | 'preferred'
    | 'namespace'
    | ((id: string) => boolean | 'auto' | 'preferred' | 'namespace')
    /**
     * Some modules contain dynamic `require` calls, or require modules that
     * contain circular dependencies, which are not handled well by static
     * imports. Including those modules as `dynamicRequireTargets` will simulate a
     * CommonJS (NodeJS-like)  environment for them with support for dynamic and
     * circular dependencies.
     *
     * Note: In extreme cases, this feature may result in some paths being
     * rendered as absolute in the final bundle. The plugin tries to avoid
     * exposing paths from the local machine, but if you are `dynamicRequirePaths`
     * with paths that are far away from your project's folder, that may require
     * replacing strings like `"/Users/John/Desktop/foo-project/"` -\> `"/"`.
     */
    dynamicRequireTargets?: string | ReadonlyArray<string>
}

export declare interface RollupDynamicImportVarsOptions {
    /**
     * Files to include in this plugin (default all).
     * @default []
     */
    include?: string | RegExp | (string | RegExp)[]
    /**
     * Files to exclude in this plugin (default none).
     * @default []
     */
    exclude?: string | RegExp | (string | RegExp)[]
    /**
     * By default, the plugin quits the build process when it encounters an error. If you set this option to true, it will throw a warning instead and leave the code untouched.
     * @default false
     */
    warnOnError?: boolean
}

/**
 * Search up for the nearest workspace root
 */
export declare function searchForWorkspaceRoot(current: string, root?: string): string;

export declare function send(req: IncomingMessage, res: ServerResponse, content: string | Buffer, type: string, etag?: string, cacheControl?: string, map?: SourceMap | null): void;

export declare type ServerHook = (server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>;

export declare interface ServerOptions extends CommonServerOptions {
    /**
     * Force dep pre-optimization regardless of whether deps have changed.
     */
    force?: boolean;
    /**
     * Configure HMR-specific options (port, host, path & protocol)
     */
    hmr?: HmrOptions | boolean;
    /**
     * chokidar watch options
     * https://github.com/paulmillr/chokidar#api
     */
    watch?: WatchOptions;
    /**
     * Create Vite dev server to be used as a middleware in an existing server
     */
    middlewareMode?: boolean | 'html' | 'ssr';
    /**
     * Prepend this folder to http requests, for use when proxying vite as a subfolder
     * Should start and end with the `/` character
     */
    base?: string;
    /**
     * Options for files served via '/\@fs/'.
     */
    fs?: FileSystemServeOptions;
    /**
     * Origin for the generated asset URLs.
     */
    origin?: string;
}

export declare function sortUserPlugins(plugins: (Plugin | Plugin[])[] | undefined): [Plugin[], Plugin[], Plugin[]];

export declare interface SSROptions {
    external?: string[];
    noExternal?: string | RegExp | (string | RegExp)[] | true;
    /**
     * Define the target for the ssr build. The browser field in package.json
     * is ignored for node but used if webworker is the target
     * Default: 'node'
     */
    target?: SSRTarget;
}

export declare type SSRTarget = 'node' | 'webworker';

export declare namespace Terser {
    export type ECMA = 5 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020

    export interface ParseOptions {
        bare_returns?: boolean
        ecma?: ECMA
        html5_comments?: boolean
        shebang?: boolean
    }

    export interface CompressOptions {
        arguments?: boolean
        arrows?: boolean
        booleans_as_integers?: boolean
        booleans?: boolean
        collapse_vars?: boolean
        comparisons?: boolean
        computed_props?: boolean
        conditionals?: boolean
        dead_code?: boolean
        defaults?: boolean
        directives?: boolean
        drop_console?: boolean
        drop_debugger?: boolean
        ecma?: ECMA
        evaluate?: boolean
        expression?: boolean
        global_defs?: object
        hoist_funs?: boolean
        hoist_props?: boolean
        hoist_vars?: boolean
        ie8?: boolean
        if_return?: boolean
        inline?: boolean | InlineFunctions
        join_vars?: boolean
        keep_classnames?: boolean | RegExp
        keep_fargs?: boolean
        keep_fnames?: boolean | RegExp
        keep_infinity?: boolean
        loops?: boolean
        module?: boolean
        negate_iife?: boolean
        passes?: number
        properties?: boolean
        pure_funcs?: string[]
        pure_getters?: boolean | 'strict'
        reduce_funcs?: boolean
        reduce_vars?: boolean
        sequences?: boolean | number
        side_effects?: boolean
        switches?: boolean
        toplevel?: boolean
        top_retain?: null | string | string[] | RegExp
        typeofs?: boolean
        unsafe_arrows?: boolean
        unsafe?: boolean
        unsafe_comps?: boolean
        unsafe_Function?: boolean
        unsafe_math?: boolean
        unsafe_symbols?: boolean
        unsafe_methods?: boolean
        unsafe_proto?: boolean
        unsafe_regexp?: boolean
        unsafe_undefined?: boolean
        unused?: boolean
    }

    export enum InlineFunctions {
        Disabled = 0,
        SimpleFunctions = 1,
        WithArguments = 2,
        WithArgumentsAndVariables = 3
    }

    export interface MangleOptions {
        eval?: boolean
        keep_classnames?: boolean | RegExp
        keep_fnames?: boolean | RegExp
        module?: boolean
        properties?: boolean | ManglePropertiesOptions
        reserved?: string[]
        safari10?: boolean
        toplevel?: boolean
    }

    export interface ManglePropertiesOptions {
        builtins?: boolean
        debug?: boolean
        keep_quoted?: boolean | 'strict'
        regex?: RegExp | string
        reserved?: string[]
    }

    export interface FormatOptions {
        ascii_only?: boolean
        beautify?: boolean
        braces?: boolean
        comments?:
        | boolean
        | 'all'
        | 'some'
        | RegExp
        | ((
        node: any,
        comment: {
            value: string
            type: 'comment1' | 'comment2' | 'comment3' | 'comment4'
            pos: number
            line: number
            col: number
        }
        ) => boolean)
        ecma?: ECMA
        ie8?: boolean
        indent_level?: number
        indent_start?: number
        inline_script?: boolean
        keep_quoted_props?: boolean
        max_line_len?: number | false
        preamble?: string
        preserve_annotations?: boolean
        quote_keys?: boolean
        quote_style?: OutputQuoteStyle
        safari10?: boolean
        semicolons?: boolean
        shebang?: boolean
        shorthand?: boolean
        source_map?: SourceMapOptions
        webkit?: boolean
        width?: number
        wrap_iife?: boolean
        wrap_func_args?: boolean
    }

    export enum OutputQuoteStyle {
        PreferDouble = 0,
        AlwaysSingle = 1,
        AlwaysDouble = 2,
        AlwaysOriginal = 3
    }

    export interface MinifyOptions {
        compress?: boolean | CompressOptions
        ecma?: ECMA
        ie8?: boolean
        keep_classnames?: boolean | RegExp
        keep_fnames?: boolean | RegExp
        mangle?: boolean | MangleOptions
        module?: boolean
        nameCache?: object
        format?: FormatOptions
        /** @deprecated use format instead */
        output?: FormatOptions
        parse?: ParseOptions
        safari10?: boolean
        sourceMap?: boolean | SourceMapOptions
        toplevel?: boolean
    }

    export interface MinifyOutput {
        code?: string
        map?: object | string
    }

    export interface SourceMapOptions {
        /** Source map object, 'inline' or source map file content */
        content?: object | string
        includeSources?: boolean
        filename?: string
        root?: string
        url?: string | 'inline'
    }
}

export declare interface TransformOptions {
    ssr?: boolean;
    html?: boolean;
}

export declare interface TransformResult {
    code: string;
    map: SourceMap | null;
    etag?: string;
    deps?: string[];
    dynamicDeps?: string[];
}

export declare function transformWithEsbuild(code: string, filename: string, options?: EsbuildTransformOptions, inMap?: object): Promise<ESBuildTransformResult>;

export declare interface Update {
    type: 'js-update' | 'css-update'
    path: string
    acceptedPath: string
    timestamp: number
}

export declare interface UpdatePayload {
    type: 'update'
    updates: Update[]
}

export declare interface UserConfig {
    /**
     * Project root directory. Can be an absolute path, or a path relative from
     * the location of the config file itself.
     * @default process.cwd()
     */
    root?: string;
    /**
     * Base public path when served in development or production.
     * @default '/'
     */
    base?: string;
    /**
     * Directory to serve as plain static assets. Files in this directory are
     * served and copied to build dist dir as-is without transform. The value
     * can be either an absolute file system path or a path relative to <root>.
     *
     * Set to `false` or an empty string to disable copied static assets to build dist dir.
     * @default 'public'
     */
    publicDir?: string | false;
    /**
     * Directory to save cache files. Files in this directory are pre-bundled
     * deps or some other cache files that generated by vite, which can improve
     * the performance. You can use `--force` flag or manually delete the directory
     * to regenerate the cache files. The value can be either an absolute file
     * system path or a path relative to <root>.
     * @default 'node_modules/.vite'
     */
    cacheDir?: string;
    /**
     * Explicitly set a mode to run in. This will override the default mode for
     * each command, and can be overridden by the command line --mode option.
     */
    mode?: string;
    /**
     * Define global variable replacements.
     * Entries will be defined on `window` during dev and replaced during build.
     */
    define?: Record<string, any>;
    /**
     * Array of vite plugins to use.
     */
    plugins?: (PluginOption | PluginOption[])[];
    /**
     * Configure resolver
     */
    resolve?: ResolveOptions & {
        alias?: AliasOptions;
    };
    /**
     * CSS related options (preprocessors and CSS modules)
     */
    css?: CSSOptions;
    /**
     * JSON loading options
     */
    json?: JsonOptions;
    /**
     * Transform options to pass to esbuild.
     * Or set to `false` to disable esbuild.
     */
    esbuild?: ESBuildOptions | false;
    /**
     * Specify additional picomatch patterns to be treated as static assets.
     */
    assetsInclude?: string | RegExp | (string | RegExp)[];
    /**
     * Server specific options, e.g. host, port, https...
     */
    server?: ServerOptions;
    /**
     * Build specific options
     */
    build?: BuildOptions;
    /**
     * Preview specific options, e.g. host, port, https...
     */
    preview?: PreviewOptions;
    /**
     * Dep optimization options
     */
    optimizeDeps?: DepOptimizationOptions;
    /* Excluded from this release type: ssr */
    /**
     * Log level.
     * Default: 'info'
     */
    logLevel?: LogLevel;
    /**
     * Custom logger.
     */
    customLogger?: Logger;
    /**
     * Default: true
     */
    clearScreen?: boolean;
    /**
     * Environment files directory. Can be an absolute path, or a path relative from
     * the location of the config file itself.
     * @default root
     */
    envDir?: string;
    /**
     * Env variables starts with `envPrefix` will be exposed to your client source code via import.meta.env.
     * @default 'VITE_'
     */
    envPrefix?: string | string[];
    /**
     * Import aliases
     * @deprecated use `resolve.alias` instead
     */
    alias?: AliasOptions;
    /**
     * Force Vite to always resolve listed dependencies to the same copy (from
     * project root).
     * @deprecated use `resolve.dedupe` instead
     */
    dedupe?: string[];
}

export declare type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export declare type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;

export declare interface ViteDevServer {
    /**
     * The resolved vite config object
     */
    config: ResolvedConfig;
    /**
     * A connect app instance.
     * - Can be used to attach custom middlewares to the dev server.
     * - Can also be used as the handler function of a custom http server
     *   or as a middleware in any connect-style Node.js frameworks
     *
     * https://github.com/senchalabs/connect#use-middleware
     */
    middlewares: Connect.Server;
    /**
     * @deprecated use `server.middlewares` instead
     */
    app: Connect.Server;
    /**
     * native Node http server instance
     * will be null in middleware mode
     */
    httpServer: http.Server | null;
    /**
     * chokidar watcher instance
     * https://github.com/paulmillr/chokidar#api
     */
    watcher: FSWatcher;
    /**
     * web socket server with `send(payload)` method
     */
    ws: WebSocketServer;
    /**
     * Rollup plugin container that can run plugin hooks on a given file
     */
    pluginContainer: PluginContainer;
    /**
     * Module graph that tracks the import relationships, url to file mapping
     * and hmr state.
     */
    moduleGraph: ModuleGraph;
    /**
     * Programmatically resolve, load and transform a URL and get the result
     * without going through the http request pipeline.
     */
    transformRequest(url: string, options?: TransformOptions): Promise<TransformResult | null>;
    /**
     * Apply vite built-in HTML transforms and any plugin HTML transforms.
     */
    transformIndexHtml(url: string, html: string, originalUrl?: string): Promise<string>;
    /**
     * Util for transforming a file with esbuild.
     * Can be useful for certain plugins.
     *
     * @deprecated import `transformWithEsbuild` from `vite` instead
     */
    transformWithEsbuild(code: string, filename: string, options?: EsbuildTransformOptions, inMap?: object): Promise<ESBuildTransformResult>;
    /**
     * Transform module code into SSR format.
     * @experimental
     */
    ssrTransform(code: string, inMap: SourceMap | null, url: string): Promise<TransformResult | null>;
    /**
     * Load a given URL as an instantiated module for SSR.
     */
    ssrLoadModule(url: string): Promise<Record<string, any>>;
    /**
     * Fix ssr error stacktrace
     */
    ssrFixStacktrace(e: Error): void;
    /**
     * Start the server.
     */
    listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>;
    /**
     * Stop the server.
     */
    close(): Promise<void>;
    /**
     * Print server urls
     */
    printUrls(): void;
    /**
     * Restart the server.
     *
     * @param forceOptimize - force the optimizer to re-bundle, same as --force cli flag
     */
    restart(forceOptimize?: boolean): Promise<void>;
    /* Excluded from this release type: _optimizeDepsMetadata */
    /* Excluded from this release type: _ssrExternals */
    /* Excluded from this release type: _globImporters */
    /* Excluded from this release type: _restartPromise */
    /* Excluded from this release type: _forceOptimizeOnRestart */
    /* Excluded from this release type: _isRunningOptimizer */
    /* Excluded from this release type: _registerMissingImport */
    /* Excluded from this release type: _pendingReload */
    /* Excluded from this release type: _pendingRequests */
}

export declare interface WatchOptions {
    /**
     * Indicates whether the process should continue to run as long as files are being watched. If
     * set to `false` when using `fsevents` to watch, no more events will be emitted after `ready`,
     * even if the process continues to run.
     */
    persistent?: boolean

    /**
     * ([anymatch](https://github.com/micromatch/anymatch)-compatible definition) Defines files/paths to
     * be ignored. The whole relative or absolute path is tested, not just filename. If a function
     * with two arguments is provided, it gets called twice per path - once with a single argument
     * (the path), second time with two arguments (the path and the
     * [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) object of that path).
     */
    ignored?: Matcher

    /**
     * If set to `false` then `add`/`addDir` events are also emitted for matching paths while
     * instantiating the watching as chokidar discovers these file paths (before the `ready` event).
     */
    ignoreInitial?: boolean

    /**
     * When `false`, only the symlinks themselves will be watched for changes instead of following
     * the link references and bubbling events through the link's path.
     */
    followSymlinks?: boolean

    /**
     * The base directory from which watch `paths` are to be derived. Paths emitted with events will
     * be relative to this.
     */
    cwd?: string

    /**
     *  If set to true then the strings passed to .watch() and .add() are treated as literal path
     *  names, even if they look like globs. Default: false.
     */
    disableGlobbing?: boolean

    /**
     * Whether to use fs.watchFile (backed by polling), or fs.watch. If polling leads to high CPU
     * utilization, consider setting this to `false`. It is typically necessary to **set this to
     * `true` to successfully watch files over a network**, and it may be necessary to successfully
     * watch files in other non-standard situations. Setting to `true` explicitly on OS X overrides
     * the `useFsEvents` default.
     */
    usePolling?: boolean

    /**
     * Whether to use the `fsevents` watching interface if available. When set to `true` explicitly
     * and `fsevents` is available this supersedes the `usePolling` setting. When set to `false` on
     * OS X, `usePolling: true` becomes the default.
     */
    useFsEvents?: boolean

    /**
     * If relying upon the [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) object that
     * may get passed with `add`, `addDir`, and `change` events, set this to `true` to ensure it is
     * provided even in cases where it wasn't already available from the underlying watch events.
     */
    alwaysStat?: boolean

    /**
     * If set, limits how many levels of subdirectories will be traversed.
     */
    depth?: number

    /**
     * Interval of file system polling.
     */
    interval?: number

    /**
     * Interval of file system polling for binary files. ([see list of binary extensions](https://gi
     * thub.com/sindresorhus/binary-extensions/blob/master/binary-extensions.json))
     */
    binaryInterval?: number

    /**
     *  Indicates whether to watch files that don't have read permissions if possible. If watching
     *  fails due to `EPERM` or `EACCES` with this set to `true`, the errors will be suppressed
     *  silently.
     */
    ignorePermissionErrors?: boolean

    /**
     * `true` if `useFsEvents` and `usePolling` are `false`). Automatically filters out artifacts
     * that occur when using editors that use "atomic writes" instead of writing directly to the
     * source file. If a file is re-added within 100 ms of being deleted, Chokidar emits a `change`
     * event rather than `unlink` then `add`. If the default of 100 ms does not work well for you,
     * you can override it by setting `atomic` to a custom value, in milliseconds.
     */
    atomic?: boolean | number

    /**
     * can be set to an object in order to adjust timing params:
     */
    awaitWriteFinish?:
    | {
        /**
         * Amount of time in milliseconds for a file size to remain constant before emitting its event.
         */
        stabilityThreshold?: number

        /**
         * File size polling interval.
         */
        pollInterval?: number
    }
    | boolean
}

export declare class WebSocket extends EventEmitter {
    /** The connection is not yet open. */
    static readonly CONNECTING: 0
    /** The connection is open and ready to communicate. */
    static readonly OPEN: 1
    /** The connection is in the process of closing. */
    static readonly CLOSING: 2
    /** The connection is closed. */
    static readonly CLOSED: 3

    binaryType: 'nodebuffer' | 'arraybuffer' | 'fragments'
    readonly bufferedAmount: number
    readonly extensions: string
    readonly protocol: string
    /** The current state of the connection */
    readonly readyState:
    | typeof WebSocket.CONNECTING
    | typeof WebSocket.OPEN
    | typeof WebSocket.CLOSING
    | typeof WebSocket.CLOSED
    readonly url: string

    /** The connection is not yet open. */
    readonly CONNECTING: 0
    /** The connection is open and ready to communicate. */
    readonly OPEN: 1
    /** The connection is in the process of closing. */
    readonly CLOSING: 2
    /** The connection is closed. */
    readonly CLOSED: 3

    onopen: (event: WebSocket.Event) => void
    onerror: (event: WebSocket.ErrorEvent) => void
    onclose: (event: WebSocket.CloseEvent) => void
    onmessage: (event: WebSocket.MessageEvent) => void

    constructor(
    address: string | URL,
    options?: WebSocket.ClientOptions | ClientRequestArgs
    )
    constructor(
    address: string | URL,
    protocols?: string | string[],
    options?: WebSocket.ClientOptions | ClientRequestArgs
    )

    close(code?: number, data?: string | Buffer): void
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void
    send(data: any, cb?: (err?: Error) => void): void
    send(
    data: any,
    options: {
        mask?: boolean | undefined
        binary?: boolean | undefined
        compress?: boolean | undefined
        fin?: boolean | undefined
    },
    cb?: (err?: Error) => void
    ): void
    terminate(): void

    // HTML5 WebSocket events
    addEventListener(
    method: 'message',
    cb: (event: WebSocket.MessageEvent) => void,
    options?: WebSocket.EventListenerOptions
    ): void
    addEventListener(
    method: 'close',
    cb: (event: WebSocket.CloseEvent) => void,
    options?: WebSocket.EventListenerOptions
    ): void
    addEventListener(
    method: 'error',
    cb: (event: WebSocket.ErrorEvent) => void,
    options?: WebSocket.EventListenerOptions
    ): void
    addEventListener(
    method: 'open',
    cb: (event: WebSocket.Event) => void,
    options?: WebSocket.EventListenerOptions
    ): void

    removeEventListener(
    method: 'message',
    cb: (event: WebSocket.MessageEvent) => void
    ): void
    removeEventListener(
    method: 'close',
    cb: (event: WebSocket.CloseEvent) => void
    ): void
    removeEventListener(
    method: 'error',
    cb: (event: WebSocket.ErrorEvent) => void
    ): void
    removeEventListener(
    method: 'open',
    cb: (event: WebSocket.Event) => void
    ): void

    // Events
    on(
    event: 'close',
    listener: (this: WebSocket, code: number, reason: Buffer) => void
    ): this
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this
    on(
    event: 'upgrade',
    listener: (this: WebSocket, request: IncomingMessage) => void
    ): this
    on(
    event: 'message',
    listener: (
    this: WebSocket,
    data: WebSocket.RawData,
    isBinary: boolean
    ) => void
    ): this
    on(event: 'open', listener: (this: WebSocket) => void): this
    on(
    event: 'ping' | 'pong',
    listener: (this: WebSocket, data: Buffer) => void
    ): this
    on(
    event: 'unexpected-response',
    listener: (
    this: WebSocket,
    request: ClientRequest,
    response: IncomingMessage
    ) => void
    ): this
    on(
    event: string | symbol,
    listener: (this: WebSocket, ...args: any[]) => void
    ): this

    once(
    event: 'close',
    listener: (this: WebSocket, code: number, reason: Buffer) => void
    ): this
    once(event: 'error', listener: (this: WebSocket, err: Error) => void): this
    once(
    event: 'upgrade',
    listener: (this: WebSocket, request: IncomingMessage) => void
    ): this
    once(
    event: 'message',
    listener: (
    this: WebSocket,
    data: WebSocket.RawData,
    isBinary: boolean
    ) => void
    ): this
    once(event: 'open', listener: (this: WebSocket) => void): this
    once(
    event: 'ping' | 'pong',
    listener: (this: WebSocket, data: Buffer) => void
    ): this
    once(
    event: 'unexpected-response',
    listener: (
    this: WebSocket,
    request: ClientRequest,
    response: IncomingMessage
    ) => void
    ): this
    once(
    event: string | symbol,
    listener: (this: WebSocket, ...args: any[]) => void
    ): this

    off(
    event: 'close',
    listener: (this: WebSocket, code: number, reason: Buffer) => void
    ): this
    off(event: 'error', listener: (this: WebSocket, err: Error) => void): this
    off(
    event: 'upgrade',
    listener: (this: WebSocket, request: IncomingMessage) => void
    ): this
    off(
    event: 'message',
    listener: (
    this: WebSocket,
    data: WebSocket.RawData,
    isBinary: boolean
    ) => void
    ): this
    off(event: 'open', listener: (this: WebSocket) => void): this
    off(
    event: 'ping' | 'pong',
    listener: (this: WebSocket, data: Buffer) => void
    ): this
    off(
    event: 'unexpected-response',
    listener: (
    this: WebSocket,
    request: ClientRequest,
    response: IncomingMessage
    ) => void
    ): this
    off(
    event: string | symbol,
    listener: (this: WebSocket, ...args: any[]) => void
    ): this

    addListener(
    event: 'close',
    listener: (code: number, reason: Buffer) => void
    ): this
    addListener(event: 'error', listener: (err: Error) => void): this
    addListener(
    event: 'upgrade',
    listener: (request: IncomingMessage) => void
    ): this
    addListener(
    event: 'message',
    listener: (data: WebSocket.RawData, isBinary: boolean) => void
    ): this
    addListener(event: 'open', listener: () => void): this
    addListener(event: 'ping' | 'pong', listener: (data: Buffer) => void): this
    addListener(
    event: 'unexpected-response',
    listener: (request: ClientRequest, response: IncomingMessage) => void
    ): this
    addListener(event: string | symbol, listener: (...args: any[]) => void): this

    removeListener(
    event: 'close',
    listener: (code: number, reason: Buffer) => void
    ): this
    removeListener(event: 'error', listener: (err: Error) => void): this
    removeListener(
    event: 'upgrade',
    listener: (request: IncomingMessage) => void
    ): this
    removeListener(
    event: 'message',
    listener: (data: WebSocket.RawData, isBinary: boolean) => void
    ): this
    removeListener(event: 'open', listener: () => void): this
    removeListener(event: 'ping' | 'pong', listener: (data: Buffer) => void): this
    removeListener(
    event: 'unexpected-response',
    listener: (request: ClientRequest, response: IncomingMessage) => void
    ): this
    removeListener(
    event: string | symbol,
    listener: (...args: any[]) => void
    ): this
}

export declare namespace WebSocket {
    /**
     * Data represents the raw message payload received over the WebSocket.
     */
    export type RawData = Buffer | ArrayBuffer | Buffer[]

    /**
     * Data represents the message payload received over the WebSocket.
     */
    export type Data = string | Buffer | ArrayBuffer | Buffer[]

    /**
     * CertMeta represents the accepted types for certificate & key data.
     */
    export type CertMeta = string | string[] | Buffer | Buffer[]

    /**
     * VerifyClientCallbackSync is a synchronous callback used to inspect the
     * incoming message. The return value (boolean) of the function determines
     * whether or not to accept the handshake.
     */
    export type VerifyClientCallbackSync = (info: {
        origin: string
        secure: boolean
        req: IncomingMessage
    }) => boolean

    /**
     * VerifyClientCallbackAsync is an asynchronous callback used to inspect the
     * incoming message. The return value (boolean) of the function determines
     * whether or not to accept the handshake.
     */
    export type VerifyClientCallbackAsync = (
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (
    res: boolean,
    code?: number,
    message?: string,
    headers?: OutgoingHttpHeaders
    ) => void
    ) => void

    export interface ClientOptions extends SecureContextOptions {
        protocol?: string | undefined
        followRedirects?: boolean | undefined
        handshakeTimeout?: number | undefined
        maxRedirects?: number | undefined
        perMessageDeflate?: boolean | PerMessageDeflateOptions | undefined
        localAddress?: string | undefined
        protocolVersion?: number | undefined
        headers?: { [key: string]: string } | undefined
        origin?: string | undefined
        agent?: Agent | undefined
        host?: string | undefined
        family?: number | undefined
        checkServerIdentity?(servername: string, cert: CertMeta): boolean
        rejectUnauthorized?: boolean | undefined
        maxPayload?: number | undefined
    }

    export interface PerMessageDeflateOptions {
        serverNoContextTakeover?: boolean | undefined
        clientNoContextTakeover?: boolean | undefined
        serverMaxWindowBits?: number | undefined
        clientMaxWindowBits?: number | undefined
        zlibDeflateOptions?:
        | {
            flush?: number | undefined
            finishFlush?: number | undefined
            chunkSize?: number | undefined
            windowBits?: number | undefined
            level?: number | undefined
            memLevel?: number | undefined
            strategy?: number | undefined
            dictionary?: Buffer | Buffer[] | DataView | undefined
            info?: boolean | undefined
        }
        | undefined
        zlibInflateOptions?: ZlibOptions | undefined
        threshold?: number | undefined
        concurrencyLimit?: number | undefined
    }

    export interface Event {
        type: string
        target: WebSocket
    }

    export interface ErrorEvent {
        error: any
        message: string
        type: string
        target: WebSocket
    }

    export interface CloseEvent {
        wasClean: boolean
        code: number
        reason: string
        type: string
        target: WebSocket
    }

    export interface MessageEvent {
        data: Data
        type: string
        target: WebSocket
    }

    export interface EventListenerOptions {
        once?: boolean | undefined
    }

    export interface ServerOptions {
        host?: string | undefined
        port?: number | undefined
        backlog?: number | undefined
        server?: Server | Server_2 | undefined
        verifyClient?:
        | VerifyClientCallbackAsync
        | VerifyClientCallbackSync
        | undefined
        handleProtocols?: (
        protocols: Set<string>,
        request: IncomingMessage
        ) => string | false
        path?: string | undefined
        noServer?: boolean | undefined
        clientTracking?: boolean | undefined
        perMessageDeflate?: boolean | PerMessageDeflateOptions | undefined
        maxPayload?: number | undefined
        skipUTF8Validation?: boolean | undefined
    }

    export interface AddressInfo {
        address: string
        family: string
        port: number
    }

    // WebSocket Server
    export class Server extends EventEmitter {
        options: ServerOptions
        path: string
        clients: Set<WebSocket>

        constructor(options?: ServerOptions, callback?: () => void)

        address(): AddressInfo | string
        close(cb?: (err?: Error) => void): void
        handleUpgrade(
        request: IncomingMessage,
        socket: Duplex,
        upgradeHead: Buffer,
        callback: (client: WebSocket, request: IncomingMessage) => void
        ): void
        shouldHandle(request: IncomingMessage): boolean | Promise<boolean>

        // Events
        on(
        event: 'connection',
        cb: (this: Server, socket: WebSocket, request: IncomingMessage) => void
        ): this
        on(event: 'error', cb: (this: Server, error: Error) => void): this
        on(
        event: 'headers',
        cb: (this: Server, headers: string[], request: IncomingMessage) => void
        ): this
        on(event: 'close' | 'listening', cb: (this: Server) => void): this
        on(
        event: string | symbol,
        listener: (this: Server, ...args: any[]) => void
        ): this

        once(
        event: 'connection',
        cb: (this: Server, socket: WebSocket, request: IncomingMessage) => void
        ): this
        once(event: 'error', cb: (this: Server, error: Error) => void): this
        once(
        event: 'headers',
        cb: (this: Server, headers: string[], request: IncomingMessage) => void
        ): this
        once(event: 'close' | 'listening', cb: (this: Server) => void): this
        once(event: string | symbol, listener: (...args: any[]) => void): this

        off(
        event: 'connection',
        cb: (this: Server, socket: WebSocket, request: IncomingMessage) => void
        ): this
        off(event: 'error', cb: (this: Server, error: Error) => void): this
        off(
        event: 'headers',
        cb: (this: Server, headers: string[], request: IncomingMessage) => void
        ): this
        off(event: 'close' | 'listening', cb: (this: Server) => void): this
        off(
        event: string | symbol,
        listener: (this: Server, ...args: any[]) => void
        ): this

        addListener(
        event: 'connection',
        cb: (client: WebSocket, request: IncomingMessage) => void
        ): this
        addListener(event: 'error', cb: (err: Error) => void): this
        addListener(
        event: 'headers',
        cb: (headers: string[], request: IncomingMessage) => void
        ): this
        addListener(event: 'close' | 'listening', cb: () => void): this
        addListener(
        event: string | symbol,
        listener: (...args: any[]) => void
        ): this

        removeListener(event: 'connection', cb: (client: WebSocket) => void): this
        removeListener(event: 'error', cb: (err: Error) => void): this
        removeListener(
        event: 'headers',
        cb: (headers: string[], request: IncomingMessage) => void
        ): this
        removeListener(event: 'close' | 'listening', cb: () => void): this
        removeListener(
        event: string | symbol,
        listener: (...args: any[]) => void
        ): this
    }

    const WebSocketServer: typeof Server
    export type WebSocketServer = Server
    const WebSocket: typeof WebSocketAlias
    export type WebSocket = WebSocketAlias

    // WebSocket stream
    export function createWebSocketStream(
    websocket: WebSocket,
    options?: DuplexOptions
    ): Duplex
}

export declare const WebSocketAlias: typeof WebSocket;

export declare type WebSocketAlias = WebSocket

export declare interface WebSocketServer {
    on: WebSocket.Server['on'];
    off: WebSocket.Server['off'];
    send(payload: HMRPayload): void;
    close(): Promise<void>;
}

export { }
