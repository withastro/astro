import { Plugin } from '../plugin';
import { ViteDevServer, SSROptions } from '..';
import { PartialResolvedId } from 'rollup';
import { PackageCache, PackageData } from '../packages';
export declare const browserExternalId = "__vite-browser-external";
export interface ResolveOptions {
    mainFields?: string[];
    conditions?: string[];
    extensions?: string[];
    dedupe?: string[];
    preserveSymlinks?: boolean;
}
export interface InternalResolveOptions extends ResolveOptions {
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
export declare function resolvePlugin(baseOptions: InternalResolveOptions): Plugin;
export declare const idToPkgMap: Map<string, PackageData>;
export declare function tryNodeResolve(id: string, importer: string | null | undefined, options: InternalResolveOptions, targetWeb: boolean, server?: ViteDevServer, ssr?: boolean): PartialResolvedId | undefined;
export declare function tryOptimizedResolve(id: string, server: ViteDevServer, importer?: string): string | undefined;
export declare function resolvePackageEntry(id: string, { dir, data, setResolvedCache, getResolvedCache }: PackageData, targetWeb: boolean, options: InternalResolveOptions): string | undefined;
