import type { Options as AcornOpts } from 'acorn';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import type { MdxjsEsm } from 'mdast-util-mdx';
import type { PluggableList } from 'unified';
export declare function appendForwardSlash(path: string): string;
export interface FileInfo {
	fileId: string;
	fileUrl: string;
}
/** @see 'vite-plugin-utils' for source */
export declare function getFileInfo(id: string, config: AstroConfig): FileInfo;
/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export declare function safeParseFrontmatter(
	code: string,
	id: string,
): import('@astrojs/markdown-remark').ParseFrontmatterResult;
export declare function jsToTreeNode(jsString: string, acornOpts?: AcornOpts): MdxjsEsm;
export declare function ignoreStringPlugins(
	plugins: any[],
	logger: AstroIntegrationLogger,
): PluggableList;
