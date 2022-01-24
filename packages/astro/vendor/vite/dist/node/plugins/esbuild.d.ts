import { Plugin } from '../plugin';
import { TransformOptions, TransformResult } from 'esbuild';
import { SourceMap } from 'rollup';
import { ResolvedConfig } from '..';
export interface ESBuildOptions extends TransformOptions {
    include?: string | RegExp | string[] | RegExp[];
    exclude?: string | RegExp | string[] | RegExp[];
    jsxInject?: string;
}
export declare type ESBuildTransformResult = Omit<TransformResult, 'map'> & {
    map: SourceMap;
};
export declare function transformWithEsbuild(code: string, filename: string, options?: TransformOptions, inMap?: object): Promise<ESBuildTransformResult>;
export declare function esbuildPlugin(options?: ESBuildOptions): Plugin;
export declare const buildEsbuildPlugin: (config: ResolvedConfig) => Plugin;
