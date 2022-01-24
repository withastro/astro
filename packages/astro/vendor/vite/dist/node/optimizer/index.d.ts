import { BuildOptions as EsbuildBuildOptions } from 'esbuild';
import { ResolvedConfig } from '../config';
import { parse } from 'es-module-lexer';
export declare type ExportsData = ReturnType<typeof parse> & {
    hasReExports?: true;
};
export interface DepOptimizationOptions {
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
    esbuildOptions?: Omit<EsbuildBuildOptions, 'bundle' | 'entryPoints' | 'external' | 'write' | 'watch' | 'outdir' | 'outfile' | 'outbase' | 'outExtension' | 'metafile'>;
    /**
     * @deprecated use `esbuildOptions.keepNames`
     */
    keepNames?: boolean;
}
export interface DepOptimizationMetadata {
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
export declare function optimizeDeps(config: ResolvedConfig, force?: boolean | undefined, asCommand?: boolean, newDeps?: Record<string, string>, // missing imports encountered after server has started
ssr?: boolean): Promise<DepOptimizationMetadata | null>;
