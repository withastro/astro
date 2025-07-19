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
 * Creates a Rust-based markdown processor using @rspress/mdx-rs
 */
export async function createRustMarkdownProcessor(
	_config: MarkdownProcessorConfig,
): Promise<RustMarkdownProcessor> {
	// Dynamic import to check if @rspress/mdx-rs is available
	let compile: any;
	try {
		const mdxRs = await import('@rspress/mdx-rs');
		compile = mdxRs.compile;
	} catch (_error) {
		throw new Error(
			'@rspress/mdx-rs package is not installed. Install it with: npm install @rspress/mdx-rs',
		);
	}

	return {
		async render(content: string, options?: MarkdownProcessorRenderOptions) {
			try {
				// Extract frontmatter if present
				let frontmatter = options?.frontmatter || {};
				let contentWithoutFrontmatter = content;

				// Simple frontmatter extraction
				const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
				if (frontmatterMatch) {
					try {
						// Parse YAML frontmatter
						const _yamlContent = frontmatterMatch[1];
						// For now, we'll just pass through the frontmatter from options
						// In a real implementation, you'd parse the YAML here
						contentWithoutFrontmatter = frontmatterMatch[2];
					} catch {
						// If parsing fails, continue with original content
					}
				}

				// Use the Rust compiler to process the content
				const result = await compile(contentWithoutFrontmatter, {
					development: process.env.NODE_ENV !== 'production',
					filepath: options?.fileURL?.pathname || 'unknown.md',
					// The @rspress/mdx-rs compile function returns a string directly
					// We need to handle the result appropriately
				});

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
					code: result,
					metadata,
				};
			} catch (error) {
				// Re-throw with more context
				const enhancedError = new Error(
					`@rspress/mdx-rs compilation failed: ${error instanceof Error ? error.message : String(error)}`,
				);
				enhancedError.cause = error;
				throw enhancedError;
			}
		},
	};
}

/**
 * Extract headings from markdown content
 */
function extractHeadingsFromContent(
	content: string,
): Array<{ depth: number; slug: string; text: string }> {
	const headings: Array<{ depth: number; slug: string; text: string }> = [];
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;

	let match;
	while ((match = headingRegex.exec(content)) !== null) {
		const depth = match[1].length;
		const text = match[2].trim();
		const slug = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();

		headings.push({ depth, slug, text });
	}

	return headings;
}

/**
 * Extract image paths from markdown content
 */
function extractImagePathsFromContent(content: string): { local: string[]; remote: string[] } {
	const local: string[] = [];
	const remote: string[] = [];

	// Match markdown image syntax ![alt](src)
	const imageRegex = /!\[.*?\]\((.*?)\)/g;

	let match;
	while ((match = imageRegex.exec(content)) !== null) {
		const src = match[1];
		if (src) {
			if (isRemoteUrl(src)) {
				remote.push(src);
			} else {
				local.push(src);
			}
		}
	}

	return { local, remote };
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
