import { Connect } from 'types/connect';
import { ViteDevServer } from '../..';
export declare function servePublicMiddleware(dir: string): Connect.NextHandleFunction;
export declare function serveStaticMiddleware(dir: string, server: ViteDevServer): Connect.NextHandleFunction;
export declare function serveRawFsMiddleware(server: ViteDevServer): Connect.NextHandleFunction;
export declare function isFileServingAllowed(url: string, server: ViteDevServer): boolean;
