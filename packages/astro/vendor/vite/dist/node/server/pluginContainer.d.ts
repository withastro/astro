/**
 * This file is refactored into TypeScript based on
 * https://github.com/preactjs/wmr/blob/main/packages/wmr/src/lib/rollup-plugin-container.js
 */
import { Plugin } from '../plugin';
import { InputOptions, OutputOptions, ModuleInfo, PartialResolvedId, LoadResult, SourceDescription } from 'rollup';
import * as acorn from 'acorn';
import { FSWatcher } from 'chokidar';
import { ResolvedConfig } from '../config';
import { ModuleGraph } from './moduleGraph';
export interface PluginContainerOptions {
    cwd?: string;
    output?: OutputOptions;
    modules?: Map<string, {
        info: ModuleInfo;
    }>;
    writeFile?: (name: string, source: string | Uint8Array) => void;
}
export interface PluginContainer {
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
export declare let parser: typeof acorn.Parser;
export declare function createPluginContainer({ plugins, logger, root, build: { rollupOptions } }: ResolvedConfig, moduleGraph?: ModuleGraph, watcher?: FSWatcher): Promise<PluginContainer>;
