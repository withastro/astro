import type { RehypePlugin } from '@astrojs/markdown-remark';
import type { VFile } from 'vfile';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
export declare const rehypeAnalyzeAstroMetadata: RehypePlugin;
export declare function getAstroMetadata(file: VFile): PluginMetadata['astro'] | undefined;
