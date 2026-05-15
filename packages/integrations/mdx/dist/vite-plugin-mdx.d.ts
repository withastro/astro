import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
}
export declare function vitePluginMdx(opts: VitePluginMdxOptions): Plugin;
