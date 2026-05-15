import type { AstroConfig } from 'astro';
import { type ExportSpecifier, type ImportSpecifier } from 'es-module-lexer';
import type { Plugin } from 'vite';
import { type FileInfo } from './utils.js';
export declare function vitePluginMdxPostprocess(astroConfig: AstroConfig): Plugin;
/**
 * Inject `Fragment` identifier import if not already present.
 */
export declare function injectUnderscoreFragmentImport(
	code: string,
	imports: readonly ImportSpecifier[],
): string;
/**
 * Inject MDX metadata as exports of the module.
 */
export declare function injectMetadataExports(
	code: string,
	exports: readonly ExportSpecifier[],
	fileInfo: FileInfo,
): string;
/**
 * Transforms the `MDXContent` default export as `Content`, which wraps `MDXContent` and
 * passes additional `components` props.
 */
export declare function transformContentExport(
	code: string,
	exports: readonly ExportSpecifier[],
): string;
/**
 * Add properties to the `Content` export.
 */
export declare function annotateContentExport(
	code: string,
	id: string,
	ssr: boolean,
	imports: readonly ImportSpecifier[],
): string;
/**
 * Check whether the `specifierRegex` matches for an import of `source` in the `code`.
 */
export declare function isSpecifierImported(
	code: string,
	imports: readonly ImportSpecifier[],
	specifierRegex: RegExp,
	source: string,
): boolean;
