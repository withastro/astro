/// <reference types="node" />
import { ResolvedConfig } from '..';
import { Plugin } from '../plugin';
/**
 * This plugin hooks into Node's module resolution algorithm at runtime,
 * so that SSR builds can benefit from `resolve.dedupe` like they do
 * in development.
 */
export declare function ssrRequireHookPlugin(config: ResolvedConfig): Plugin | null;
declare type NodeResolveFilename = (request: string, parent: NodeModule, isMain: boolean, options?: Record<string, any>) => string;
export declare function hookNodeResolve(getResolver: (resolveFilename: NodeResolveFilename) => NodeResolveFilename): () => void;
export {};
