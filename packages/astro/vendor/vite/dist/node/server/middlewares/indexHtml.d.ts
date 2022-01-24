import { Connect } from 'types/connect';
import { ViteDevServer } from '../..';
export declare function createDevHtmlTransformFn(server: ViteDevServer): (url: string, html: string, originalUrl: string) => Promise<string>;
export declare function indexHtmlMiddleware(server: ViteDevServer): Connect.NextHandleFunction;
