import { SourceMap } from 'rollup';
import { ViteDevServer } from '..';
export interface TransformResult {
    code: string;
    map: SourceMap | null;
    etag?: string;
    deps?: string[];
    dynamicDeps?: string[];
}
export interface TransformOptions {
    ssr?: boolean;
    html?: boolean;
}
export declare function transformRequest(url: string, server: ViteDevServer, options?: TransformOptions): Promise<TransformResult | null>;
