import type { MarkdownProcessor, MarkdownProcessorRenderOptions } from '@astrojs/markdown-remark';
import type { MarkdownProcessorConfig } from './processor-router.js';

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
 * Creates a Rust-based markdown processor using @mdx-js/mdx-rs
 */
export async function createRustMarkdownProcessor(
	config: MarkdownProcessorConfig,
): Promise<RustMarkdownProcessor> {
	// Dynamic import to check if @mdx-js/mdx-rs is available
	let mdxRs: any;
	try {
		mdxRs = await import('@mdx-js/mdx-rs');
	} catch (_error) {
		throw new Error(
			'@mdx-js/mdx-rs package is not installed. Install it with: npm install @mdx-js/mdx-rs',
		);
	}

	// Initialize the Rust compiler with configuration
	const compiler = await mdxRs.createCompiler({
		development: process.env.NODE_ENV !== 'production',
		cacheDir: config.rsOptions.cacheDir,
		parallelism: config.rsOptions.parallelism,
		// Pass through relevant markdown config
		remarkPlugins: config.remarkPlugins || [],
		rehypePlugins: config.rehypePlugins || [],
		remarkRehype: config.remarkRehype || {},
		gfm: config.gfm !== false,
		smartypants: config.smartypants !== false,
	});

	return {
		async render(content: string, options?: MarkdownProcessorRenderOptions) {
			try {
				// Use the Rust compiler to process the content
				const result = await compiler.process(content, {
					filePath: options?.fileURL?.pathname,
					frontmatter: options?.frontmatter,
				});

				// Extract metadata in the same format as the JavaScript processor
				const metadata = {
					headings: extractHeadings(result.data.headings || []),
					frontmatter: result.data.frontmatter || options?.frontmatter || {},
					localImagePaths: extractLocalImagePaths(result.data.imagePaths || []),
					remoteImagePaths: extractRemoteImagePaths(result.data.imagePaths || []),
				};

				return {
					code: result.value,
					metadata,
				};
			} catch (error) {
				// Enhance error with context
				const enhancedError = new Error(
					`MDX-rs compilation failed: ${error instanceof Error ? error.message : String(error)}`,
				);
				enhancedError.cause = error;
				throw enhancedError;
			}
		},
	};
}

/**
 * Extract headings in the format expected by Astro
 */
function extractHeadings(headings: any[]): Array<{ depth: number; slug: string; text: string }> {
	return headings.map((heading) => ({
		depth: heading.depth || 1,
		slug: heading.slug || '',
		text: heading.text || '',
	}));
}

/**
 * Extract local image paths from the processed data
 */
function extractLocalImagePaths(imagePaths: any[]): string[] {
	return imagePaths
		.filter((path) => typeof path === 'string' && !isRemoteUrl(path))
		.map((path) => path.toString());
}

/**
 * Extract remote image paths from the processed data
 */
function extractRemoteImagePaths(imagePaths: any[]): string[] {
	return imagePaths
		.filter((path) => typeof path === 'string' && isRemoteUrl(path))
		.map((path) => path.toString());
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
