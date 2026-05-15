import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { PluggableList } from 'unified';
import type { OptimizeOptions } from './rehype-optimize-static.js';
export type MdxOptions = Omit<typeof markdownConfigDefaults, 'remarkPlugins' | 'rehypePlugins'> & {
	extendMarkdownConfig: boolean;
	recmaPlugins: PluggableList;
	remarkPlugins: PluggableList;
	rehypePlugins: PluggableList;
	remarkRehype: RemarkRehypeOptions;
	optimize: boolean | OptimizeOptions;
};
export declare function getContainerRenderer(): AstroRenderer;
export default function mdx(partialMdxOptions?: Partial<MdxOptions>): AstroIntegration;
