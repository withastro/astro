import { Plugin } from 'esbuild';
import { ResolvedConfig } from '..';
import { ExportsData } from '.';
export declare function esbuildDepPlugin(qualified: Record<string, string>, exportsData: Record<string, ExportsData>, config: ResolvedConfig, ssr?: boolean): Plugin;
