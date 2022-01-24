/// <reference types="node" />
import { ViteDevServer } from '..';
import { ModuleNode } from './moduleGraph';
import { Server } from 'http';
export declare const debugHmr: (...args: any[]) => any;
export interface HmrOptions {
    protocol?: string;
    host?: string;
    port?: number;
    clientPort?: number;
    path?: string;
    timeout?: number;
    overlay?: boolean;
    server?: Server;
}
export interface HmrContext {
    file: string;
    timestamp: number;
    modules: Array<ModuleNode>;
    read: () => string | Promise<string>;
    server: ViteDevServer;
}
export declare function handleHMRUpdate(file: string, server: ViteDevServer): Promise<any>;
export declare function handleFileAddUnlink(file: string, server: ViteDevServer, isUnlink?: boolean): Promise<void>;
export declare function handlePrunedModules(mods: Set<ModuleNode>, { ws }: ViteDevServer): void;
/**
 * Lex import.meta.hot.accept() for accepted deps.
 * Since hot.accept() can only accept string literals or array of string
 * literals, we don't really need a heavy @babel/parse call on the entire source.
 *
 * @returns selfAccepts
 */
export declare function lexAcceptedHmrDeps(code: string, start: number, urls: Set<{
    url: string;
    start: number;
    end: number;
}>): boolean;
