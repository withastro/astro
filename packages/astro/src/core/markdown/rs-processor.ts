import type { MarkdownProcessor, MarkdownProcessorRenderOptions } from '@astrojs/markdown-remark';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { slug as githubSlug } from 'github-slugger';
import { MarkdownError } from '../errors/index.js';
import { isYAMLException } from '../errors/utils.js';
import type { MarkdownProcessorConfig } from './processor-router.js';

/**
 * Type definitions for @rspress/mdx-rs
 */
interface RspressMdxRsCompileOptions {
	value: string;
	filepath: string;
	root?: string;
	development?: boolean;
	[key: string]: any;
}

interface RspressMdxRsCompileResult {
	code: string;
	html: string;
	links: any[];
	title?: string;
	toc: any[];
	languages: string[];
	frontmatter: string; // @rspress/mdx-rs returns frontmatter as string
}

interface RspressMdxRsModule {
	compile: (options: RspressMdxRsCompileOptions) => Promise<RspressMdxRsCompileResult>;
}

/**
 * Extended frontmatter parse result
 */
interface FrontmatterParseResult {
	content: string;
	frontmatter: Record<string, any>;
}

/**
 * Safely parse frontmatter from content
 */
function safeParseFrontmatter(source: string, id?: string): FrontmatterParseResult {
	try {
		return parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
	} catch (err: any) {
		const markdownError = new MarkdownError({
			name: 'MarkdownError',
			message: err.message,
			stack: err.stack,
			location: id
				? {
						file: id,
					}
				: undefined,
		});
		if (isYAMLException(err)) {
			markdownError.setLocation({
				file: id,
				line: err.mark?.line ? err.mark.line + 1 : undefined,
				column: err.mark?.column ? err.mark.column + 1 : undefined,
			});
		}
		throw markdownError;
	}
}

/**
 * Get compile options from configuration
 */
function getCompileOptions(
	config: MarkdownProcessorConfig,
	content: string,
	filepath: string,
): RspressMdxRsCompileOptions {
	const options: RspressMdxRsCompileOptions = {
		value: content,
		filepath,
		root: config.markdownRSOptions?.cacheDir || '.',
		development: process.env.NODE_ENV !== 'production',
	};

	// Map markdownRSOptions configuration to @rspress/mdx-rs options
	if (config.markdownRSOptions?.cacheDir) {
		options.root = config.markdownRSOptions.cacheDir;
	}

	return options;
}

interface RustMarkdownProcessor extends MarkdownProcessor {
	render(
		content: string,
		options?: MarkdownProcessorRenderOptions,
	): Promise<{
		code: string;
		metadata: {
			headings: Array<{ depth: number; slug: string; text: string }>;
			frontmatter: Record<string, any>;
			localImagePaths: string[];
			remoteImagePaths: string[];
		};
	}>;
}

/**
 * Creates a Rust-based markdown processor using @rspress/mdx-rs
 */
export async function createRustMarkdownProcessor(
	config: MarkdownProcessorConfig,
): Promise<RustMarkdownProcessor> {
	// Dynamic import to check if @rspress/mdx-rs is available
	let compile: RspressMdxRsModule['compile'];
	try {
		const mdxRs = (await import('@rspress/mdx-rs')) as RspressMdxRsModule;
		compile = mdxRs.compile;
		if (typeof compile !== 'function') {
			throw new Error('@rspress/mdx-rs: compile function not found or invalid');
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`@rspress/mdx-rs is not available or failed to load: ${message}`);
	}

	return {
		async render(content: string, options?: MarkdownProcessorRenderOptions) {
			try {
				// Parse frontmatter using Astro's parser for consistency
				const fileURL = (options as any)?.fileURL; // Handle internal prop
				const parsed = safeParseFrontmatter(content, fileURL?.pathname);
				const frontmatter = options?.frontmatter || parsed.frontmatter;
				const contentWithoutFrontmatter = parsed.content;

				// Use the Rust compiler to process the content
				const filepath = fileURL?.pathname || 'unknown.md';
				const compileOptions = getCompileOptions(config, contentWithoutFrontmatter, filepath);
				const result = await compile(compileOptions);

				// Extract headings from the content (simplified version)
				const headings = extractHeadingsFromContent(contentWithoutFrontmatter);

				// Extract image paths from the content
				const imagePaths = extractImagePathsFromContent(contentWithoutFrontmatter);

				// Extract metadata in the same format as the JavaScript processor
				const metadata = {
					headings,
					frontmatter,
					localImagePaths: imagePaths.local,
					remoteImagePaths: imagePaths.remote,
				};

				return {
					code: result.code,
					metadata,
				};
			} catch (error) {
				// Categorize and enhance errors for better debugging
				const fileURL = (options as any)?.fileURL; // Handle internal prop
				const filepath = fileURL?.pathname || 'unknown.md';

				if (error instanceof MarkdownError) {
					// Re-throw MarkdownError (from frontmatter parsing) as-is
					throw error;
				}

				if (error instanceof Error) {
					// Check for specific @rspress/mdx-rs errors
					if (error.message.includes('parse') || error.message.includes('syntax')) {
						const parseError = new MarkdownError({
							name: 'MarkdownError',
							message: `MDX compilation failed in ${filepath}: ${error.message}`,
							stack: error.stack,
							location: { file: filepath },
						});
						parseError.cause = error;
						throw parseError;
					}

					// Other compilation errors
					const compilationError = new Error(
						`@rspress/mdx-rs compilation failed for ${filepath}: ${error.message}`,
					);
					compilationError.cause = error;
					throw compilationError;
				}

				// Unknown error type
				const unknownError = new Error(
					`Unknown error during MDX compilation in ${filepath}: ${String(error)}`,
				);
				unknownError.cause = error;
				throw unknownError;
			}
		},
	};
}

/**
 * Extract headings from markdown content using github-slugger for consistency
 */
function extractHeadingsFromContent(
	content: string,
): Array<{ depth: number; slug: string; text: string }> {
	const headings: Array<{ depth: number; slug: string; text: string }> = [];
	const headingRegex = /^(#{1,6})\s+(\S.*)$/gm;

	let match;
	while ((match = headingRegex.exec(content)) !== null) {
		const depth = match[1].length;
		const text = match[2].trim();
		// Use github-slugger for consistent slug generation like Astro
		const slug = githubSlug(text);

		headings.push({ depth, slug, text });
	}

	return headings;
}

/**
 * Extract image paths from markdown content (markdown syntax + HTML img tags)
 */
function extractImagePathsFromContent(content: string): { local: string[]; remote: string[] } {
	// Match markdown image syntax ![alt](src)
	const markdownSources = [...content.matchAll(/!\[.*?\]\((.*?)\)/g)].map(m => m[1]);
	// Match HTML img tags <img src="src" />
	const htmlSources = [...content.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
	
	// Remove duplicates
	const validSources = [...new Set([...markdownSources, ...htmlSources])]
		.map(src => src?.trim())
		.filter(src => src && !isDataUrl(src));
	
	return {
		local: validSources.filter(src => !isRemoteUrl(src)),
		remote: validSources.filter(isRemoteUrl)
	};
}

/**
 * Check if a URL is remote (has protocol)
 */
function isRemoteUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Check if a URL is a data URL
 */
function isDataUrl(url: string): boolean {
	return url.startsWith('data:');
}
