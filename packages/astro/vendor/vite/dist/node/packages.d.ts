import { ResolvedConfig } from './config';
import { Plugin } from './plugin';
/** Cache for package.json resolution and package.json contents */
export declare type PackageCache = Map<string, PackageData>;
export interface PackageData {
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
export declare function invalidatePackageData(packageCache: PackageCache, pkgPath: string): void;
export declare function resolvePackageData(id: string, basedir: string, preserveSymlinks?: boolean, packageCache?: PackageCache): PackageData | null;
export declare function loadPackageData(pkgPath: string, preserveSymlinks?: boolean, packageCache?: PackageCache): PackageData;
export declare function watchPackageDataPlugin(config: ResolvedConfig): Plugin;
