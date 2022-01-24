/// <reference types="node" />
import * as http from 'http';
import { CommonServerOptions } from '../http';
import { InlineConfig, ResolvedConfig } from '../config';
import { PluginContainer } from './pluginContainer';
import { FSWatcher, WatchOptions } from 'types/chokidar';
import { WebSocketServer } from './ws';
import { ModuleGraph, ModuleNode } from './moduleGraph';
import { Connect } from 'types/connect';
import { HmrOptions } from './hmr';
import { TransformOptions, TransformResult } from './transformRequest';
import { ESBuildTransformResult } from '../plugins/esbuild';
import { TransformOptions as EsbuildTransformOptions } from 'esbuild';
import { DepOptimizationMetadata } from '../optimizer';
import { SourceMap } from 'rollup';
export { searchForWorkspaceRoot } from './searchRoot';
export interface ServerOptions extends CommonServerOptions {
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
export interface ResolvedServerOptions extends ServerOptions {
    fs: Required<FileSystemServeOptions>;
}
export interface FileSystemServeOptions {
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
export declare type ServerHook = (server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>;
export interface ViteDevServer {
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
    /**
     * @internal
     */
    _optimizeDepsMetadata: DepOptimizationMetadata | null;
    /**
     * Deps that are externalized
     * @internal
     */
    _ssrExternals: string[] | null;
    /**
     * @internal
     */
    _globImporters: Record<string, {
        module: ModuleNode;
        importGlobs: {
            base: string;
            pattern: string;
        }[];
    }>;
    /**
     * @internal
     */
    _restartPromise: Promise<void> | null;
    /**
     * @internal
     */
    _forceOptimizeOnRestart: boolean;
    /**
     * @internal
     */
    _isRunningOptimizer: boolean;
    /**
     * @internal
     */
    _registerMissingImport: ((id: string, resolved: string, ssr: boolean | undefined) => void) | null;
    /**
     * @internal
     */
    _pendingReload: Promise<void> | null;
    /**
     * @internal
     */
    _pendingRequests: Map<string, Promise<TransformResult | null>>;
}
export declare function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>;
export declare function resolveServerOptions(root: string, raw?: ServerOptions): ResolvedServerOptions;
