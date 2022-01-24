import { Plugin } from '../plugin';
import { ViteDevServer } from '../server';
import { OutputBundle, OutputChunk } from 'rollup';
import { ResolvedConfig } from '../config';
import { AttributeNode, NodeTransform, ElementNode } from '@vue/compiler-dom';
export declare const isHTMLProxy: (id: string) => boolean;
export declare const htmlProxyMap: WeakMap<Readonly<Omit<import("../config").UserConfig, "plugins" | "alias" | "dedupe" | "assetsInclude" | "optimizeDeps"> & {
    configFile: string | undefined;
    configFileDependencies: string[];
    inlineConfig: import("../config").InlineConfig;
    root: string;
    base: string;
    publicDir: string;
    command: "build" | "serve";
    mode: string;
    isProduction: boolean;
    env: Record<string, any>;
    resolve: import("./resolve").ResolveOptions & {
        alias: import("types/alias").Alias[];
    };
    plugins: readonly Plugin[];
    server: import("../server").ResolvedServerOptions;
    build: Required<Omit<import("..").BuildOptions, "base" | "cleanCssOptions" | "polyfillDynamicImport" | "brotliSize">>;
    preview: import("..").ResolvedPreviewOptions;
    assetsInclude: (file: string) => boolean;
    logger: import("..").Logger;
    createResolver: (options?: Partial<import("./resolve").InternalResolveOptions> | undefined) => import("../config").ResolveFn;
    optimizeDeps: Omit<import("..").DepOptimizationOptions, "keepNames">;
    packageCache: import("..").PackageCache;
}>, Map<string, string[]>>;
export declare function htmlInlineScriptProxyPlugin(config: ResolvedConfig): Plugin;
/** Add script to cache */
export declare function addToHTMLProxyCache(config: ResolvedConfig, filePath: string, index: number, code: string): void;
export declare const assetAttrsConfig: Record<string, string[]>;
export declare const isAsyncScriptMap: WeakMap<Readonly<Omit<import("../config").UserConfig, "plugins" | "alias" | "dedupe" | "assetsInclude" | "optimizeDeps"> & {
    configFile: string | undefined;
    configFileDependencies: string[];
    inlineConfig: import("../config").InlineConfig;
    root: string;
    base: string;
    publicDir: string;
    command: "build" | "serve";
    mode: string;
    isProduction: boolean;
    env: Record<string, any>;
    resolve: import("./resolve").ResolveOptions & {
        alias: import("types/alias").Alias[];
    };
    plugins: readonly Plugin[];
    server: import("../server").ResolvedServerOptions;
    build: Required<Omit<import("..").BuildOptions, "base" | "cleanCssOptions" | "polyfillDynamicImport" | "brotliSize">>;
    preview: import("..").ResolvedPreviewOptions;
    assetsInclude: (file: string) => boolean;
    logger: import("..").Logger;
    createResolver: (options?: Partial<import("./resolve").InternalResolveOptions> | undefined) => import("../config").ResolveFn;
    optimizeDeps: Omit<import("..").DepOptimizationOptions, "keepNames">;
    packageCache: import("..").PackageCache;
}>, Map<string, boolean>>;
export declare function traverseHtml(html: string, filePath: string, visitor: NodeTransform): Promise<void>;
export declare function getScriptInfo(node: ElementNode): {
    src: AttributeNode | undefined;
    isModule: boolean;
    isAsync: boolean;
};
/**
 * Compiles index.html into an entry js module
 */
export declare function buildHtmlPlugin(config: ResolvedConfig): Plugin;
export interface HtmlTagDescriptor {
    tag: string;
    attrs?: Record<string, string | boolean | undefined>;
    children?: string | HtmlTagDescriptor[];
    /**
     * default: 'head-prepend'
     */
    injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
}
export declare type IndexHtmlTransformResult = string | HtmlTagDescriptor[] | {
    html: string;
    tags: HtmlTagDescriptor[];
};
export interface IndexHtmlTransformContext {
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
export declare type IndexHtmlTransform = IndexHtmlTransformHook | {
    enforce?: 'pre' | 'post';
    transform: IndexHtmlTransformHook;
};
export declare function resolveHtmlTransforms(plugins: readonly Plugin[]): [IndexHtmlTransformHook[], IndexHtmlTransformHook[]];
export declare function applyHtmlTransforms(html: string, hooks: IndexHtmlTransformHook[], ctx: IndexHtmlTransformContext): Promise<string>;
