import { ViteDevServer } from '../server';
interface SSRContext {
    global: typeof globalThis;
}
declare type SSRModule = Record<string, any>;
export declare function ssrLoadModule(url: string, server: ViteDevServer, context?: SSRContext, urlStack?: string[]): Promise<SSRModule>;
export {};
