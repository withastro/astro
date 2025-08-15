import type { ProcessorOptions } from '@mdx-js/mdx';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import remarkRehype from 'remark-rehype';
import type { PluggableList } from 'unified';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
// Binary transfer utilities removed - using JSON for now

// Import the Rust parser
let rustParser: any;

/**
 * Collect metadata from mdast for Astro
 */
function collectMetadataFromMdast(mdast: MdastRoot, vfile: VFile) {
	const headings: Array<{ depth: number; text: string; slug: string }> = [];
	const localImagePaths: string[] = [];
	const remoteImagePaths: string[] = [];

	// Visit all nodes to collect metadata
	visit(mdast, (node: any) => {
		// Collect headings
		if (node.type === 'heading') {
			const text = extractText(node);
			const slug = text
				.toLowerCase()
				.replace(/\s+/g, '-')
				.replace(/[^\w-]/g, '');
			headings.push({
				depth: node.depth,
				text,
				slug,
			});
		}

		// Collect image paths
		if (node.type === 'image' && node.url) {
			const url = node.url as string;
			// Determine if it's a local or remote image
			if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
				remoteImagePaths.push(url);
			} else {
				localImagePaths.push(url);
			}
		}

		// Extract frontmatter
		if (node.type === 'yaml' || node.type === 'toml') {
			// This would need proper frontmatter parsing
			// For now, just mark that frontmatter exists
			vfile.data.astro!.frontmatter = { _hasContent: true };
		}
	});

	// Update vfile metadata
	if (vfile.data.astro) {
		vfile.data.astro.headings = headings;
		vfile.data.astro.localImagePaths = localImagePaths;
		vfile.data.astro.remoteImagePaths = remoteImagePaths;
	}
}

/**
 * Extract text content from a node
 */
function extractText(node: any): string {
	if (node.value) {
		return node.value;
	}
	if (node.children) {
		return node.children.map((child: any) => extractText(child)).join('');
	}
	return '';
}

async function loadRustParser() {
	if (!rustParser) {
		try {
			rustParser = await import('../../src/rust-parser/index.js');
		} catch {
			throw new Error('Rust parser not available. Please build rust-parser first.');
		}
	}
	return rustParser;
}

/**
 * Rust MDX Processor
 *
 * This processor uses an AST bridge pattern to combine:
 * 1. Rust parsing (fast) - Parse MDX to AST using Rust
 * 2. JS transformation (compatible) - Apply remark/rehype plugins
 * 3. Rust generation (fast) - Generate JavaScript from AST using Rust
 */
export async function createRustProcessor(options: ProcessorOptions = {}) {
	const rust = await loadRustParser();

	// Create a unified processor for running plugins
	const remarkProcessor = unified();
	const rehypeProcessor = unified();

	// Add remark plugins
	if (options.remarkPlugins && options.remarkPlugins.length > 0) {
		const plugins = options.remarkPlugins as PluggableList;
		for (const plugin of plugins) {
			if (Array.isArray(plugin)) {
				remarkProcessor.use(plugin[0] as any, plugin[1]);
			} else if (plugin) {
				remarkProcessor.use(plugin as any);
			}
		}
	}

	// Add remark-rehype conversion
	remarkProcessor.use(remarkRehype, options.remarkRehypeOptions || {});

	// Add rehype plugins
	if (options.rehypePlugins && options.rehypePlugins.length > 0) {
		const plugins = options.rehypePlugins as PluggableList;
		for (const plugin of plugins) {
			if (Array.isArray(plugin)) {
				rehypeProcessor.use(plugin[0] as any, plugin[1]);
			} else if (plugin) {
				rehypeProcessor.use(plugin as any);
			}
		}
	}

	return {
		async process(content: string | VFile): Promise<{ value: string; map: any; data: any }> {
			const enableMetrics = process.env.MDX_PERF_LOG === '1';
			const metrics: Record<string, number> = {};
			
			// Create VFile if needed
			const vfile = typeof content === 'string' ? new VFile({ value: content }) : content;
			const source = String(vfile.value);

			// Initialize Astro metadata
			if (!vfile.data.astro) {
				vfile.data.astro = {
					frontmatter: {},
					headings: [],
					localImagePaths: [],
					remoteImagePaths: [],
				};
			}

			// Step 1: Parse MDX to AST using Rust
			const parseStart = enableMetrics ? performance.now() : 0;
			
			// Always use JSON for now (binary transfer removed)
			const astJson = rust.parseToAst(source);
			let mdast: MdastRoot = JSON.parse(astJson) as MdastRoot;
			
			if (enableMetrics) {
				metrics.rustParse = performance.now() - parseStart;
			}

			// Collect metadata from mdast
			const metadataStart = enableMetrics ? performance.now() : 0;
			collectMetadataFromMdast(mdast, vfile);
			if (enableMetrics) {
				metrics.metadataCollection = performance.now() - metadataStart;
			}

			// Step 2: Transform AST with remark plugins
			if (options.remarkPlugins && options.remarkPlugins.length > 0) {
				const remarkStart = enableMetrics ? performance.now() : 0;
				vfile.data.mdast = mdast;
				const processedVFile = await remarkProcessor.run(mdast, vfile);
				mdast = processedVFile as unknown as MdastRoot;
				if (enableMetrics) {
					metrics.remarkPlugins = performance.now() - remarkStart;
				}
			}

			// Step 3: Convert mdast to hast for rehype plugins
			let hast: HastRoot | undefined;
			if (options.rehypePlugins && options.rehypePlugins.length > 0) {
				const rehypeStart = enableMetrics ? performance.now() : 0;
				// Run remark-rehype to convert mdast to hast
				const hastVFile = await remarkProcessor.runSync(mdast, vfile);
				hast = hastVFile as unknown as HastRoot;

				// Run rehype plugins
				const processedHast = await rehypeProcessor.run(hast, vfile);
				hast = processedHast as unknown as HastRoot;
				if (enableMetrics) {
					metrics.rehypePlugins = performance.now() - rehypeStart;
				}
			}

			// Step 4: Generate JavaScript from AST using Rust
			const generateStart = enableMetrics ? performance.now() : 0;
			// Use hast if available (after rehype processing), otherwise use mdast
			const finalAst = hast || mdast;
			
			// Always use JSON for now (binary transfer removed)
			const astSerializationStart = enableMetrics ? performance.now() : 0;
			const serializedAst = JSON.stringify(finalAst);
			if (enableMetrics) {
				metrics.astSerialization = performance.now() - astSerializationStart;
			}
			const code = rust.generateFromAst(serializedAst);
			
			if (enableMetrics) {
				metrics.rustGenerate = performance.now() - generateStart;
				metrics.rustGenerateOnly = (performance.now() - generateStart) - (metrics.astSerialization || 0);
			}

			// Log detailed metrics if enabled
			if (enableMetrics && vfile.path) {
				const totalTime = Object.values(metrics).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
				console.log(`MDX Rust Phases for ${vfile.path} (JSON mode):`);
				console.log(`  Parse (Rust): ${metrics.rustParse?.toFixed(2)}ms`);
				console.log(`  Metadata: ${metrics.metadataCollection?.toFixed(2)}ms`);
				if (metrics.remarkPlugins) {
					console.log(`  Remark Plugins: ${metrics.remarkPlugins.toFixed(2)}ms`);
				}
				if (metrics.rehypePlugins) {
					console.log(`  Rehype Plugins: ${metrics.rehypePlugins.toFixed(2)}ms`);
				}
				console.log(`  AST Serialization: ${metrics.astSerialization?.toFixed(2)}ms (JSON)`);
				console.log(`  Generate (Rust): ${metrics.rustGenerateOnly?.toFixed(2)}ms`);
				console.log(`  Total: ${totalTime.toFixed(2)}ms`);
			}

			// Create the result with proper vfile.data structure
			const result = {
				value: code,
				map: null, // Source maps not supported yet in Rust compiler
				data: vfile.data,
			};

			return result;
		},

		async compile(content: string | VFile): Promise<{ value: string; map: any; data: any }> {
			return this.process(content);
		},

		compileSync(): never {
			throw new Error('Rust compiler does not support synchronous compilation');
		},
	};
}

/**
 * Check if Rust compiler is available
 */
export async function isRustCompilerAvailable(): Promise<boolean> {
	try {
		await loadRustParser();
		return true;
	} catch {
		return false;
	}
}
