import type { MarkdownHeading } from '@astrojs/markdown-remark';
import type * as rollup from 'rollup';
import type { DataEntry, RenderedContent } from '../../content/data-store.js';
import type { LiveCollectionError } from '../../content/loaders/errors.js';
import type { AstroComponentFactory } from '../../runtime/server/index.js';
import type { AstroConfig } from './config.js';

export interface AstroInstance {
	file: string;
	url: string | undefined;
	default: AstroComponentFactory;
}

export interface MarkdownInstance<T extends Record<string, any>> {
	frontmatter: T;
	/** Absolute file path (e.g. `/home/user/projects/.../file.md`) */
	file: string;
	/** Browser URL for files under `/src/pages` (e.g. `/en/guides/markdown-content`) */
	url: string | undefined;
	/** Component to render content in `.astro` files. Usage: `<Content />` */
	Content: AstroComponentFactory;
	/** raw Markdown file content, excluding layout HTML and YAML frontmatter */
	rawContent(): string;
	/** Markdown file compiled to HTML, excluding layout HTML */
	compiledContent(): Promise<string>;
	/** List of headings (h1 -> h6) with associated metadata */
	getHeadings(): MarkdownHeading[];
	default: AstroComponentFactory;
}

export interface MDXInstance<T extends Record<string, any>>
	extends Omit<MarkdownInstance<T>, 'rawContent' | 'compiledContent'> {
	components: Record<string, AstroComponentFactory> | undefined;
}

/**
 * Props accepted by the MDX `Content` component when using `await render()`.
 * Allows passing custom components to override default MDX element rendering.
 *
 * @example
 * ```astro
 * ---
 * import { getEntry, render } from 'astro:content';
 * import MyCustomH1 from '../components/CustomHeading.astro';
 * import MyImage from '../images/MyImage.jpg';
 * const entry = await getEntry('blog', 'post');
 * const { Content } = await render(entry);
 * ---
 * <Content components={{ h1: MyCustomH1, img: MyImage }} />
 * ```
 */
export interface MDXContentProps {
	/** Custom components to use for MDX elements (e.g., h1, h2, img, a, etc.) */
	components?: Record<string, AstroComponentFactory>;
	/** Any additional props to pass to the MDX content */
	[key: string]: any;
}

/**
 * The MDX `Content` component returned from `await render()`.
 * Extends `AstroComponentFactory` with typed props for better developer experience.
 */
export type MDXContent = AstroComponentFactory & ((props?: MDXContentProps) => any);

export interface MarkdownLayoutProps<T extends Record<string, any>> {
	frontmatter: {
		file: MarkdownInstance<T>['file'];
		url: MarkdownInstance<T>['url'];
	} & T;
	file: MarkdownInstance<T>['file'];
	url: MarkdownInstance<T>['url'];
	headings: MarkdownHeading[];
	rawContent: MarkdownInstance<T>['rawContent'];
	compiledContent: MarkdownInstance<T>['compiledContent'];
}

export interface MDXLayoutProps<T extends Record<string, any>>
	extends Omit<MarkdownLayoutProps<T>, 'rawContent' | 'compiledContent'> {
	components: MDXInstance<T>['components'];
}

export type ContentEntryModule = {
	id: string;
	collection: string;
	slug: string;
	body: string;
	data: Record<string, unknown>;
	_internal: {
		rawData: string;
		filePath: string;
	};
};

export type DataEntryModule = {
	id: string;
	collection: string;
	data: Record<string, unknown>;
	_internal: {
		rawData: string;
		filePath: string;
	};
};

export type ContentEntryRenderFunction = (entry: DataEntry) => Promise<RenderedContent>;

export interface ContentEntryType {
	extensions: string[];
	getEntryInfo(params: {
		fileUrl: URL;
		contents: string;
	}): GetContentEntryInfoReturnType | Promise<GetContentEntryInfoReturnType>;
	getRenderModule?(
		this: rollup.PluginContext,
		params: {
			contents: string;
			fileUrl: URL;
			viteId: string;
		},
	): rollup.LoadResult | Promise<rollup.LoadResult>;
	contentModuleTypes?: string;
	getRenderFunction?(config: AstroConfig): Promise<ContentEntryRenderFunction>;

	/**
	 * Handle asset propagation for rendered content to avoid bleed.
	 * Ex. MDX content can import styles and scripts, so `handlePropagation` should be true.
	 * @default true
	 */
	handlePropagation?: boolean;
}

export interface RefreshContentOptions {
	loaders?: Array<string>;
	context?: Record<string, any>;
}

type GetContentEntryInfoReturnType = {
	data: Record<string, unknown>;
	/**
	 * Used for error hints to point to correct line and location
	 * Should be the untouched data as read from the file,
	 * including newlines
	 */
	rawData: string;
	body: string;
	slug: string;
};

export interface DataEntryType {
	extensions: string[];
	getEntryInfo(params: {
		fileUrl: URL;
		contents: string;
	}): GetDataEntryInfoReturnType | Promise<GetDataEntryInfoReturnType>;
}

export type GetDataEntryInfoReturnType = { data: Record<string, unknown>; rawData?: string };

export interface CacheHint {
	/** Cache tags */
	tags?: Array<string>;
	/** Last modified time of the content */
	lastModified?: Date;
}

export interface LiveDataEntry<TData extends Record<string, any> = Record<string, unknown>> {
	/** The ID of the entry. Unique per collection. */
	id: string;
	/** The parsed entry data */
	data: TData;
	/** Optional rendered content */
	rendered?: {
		html: string;
	};
	/** A hint for how to cache this entry */
	cacheHint?: CacheHint;
}

export interface LiveDataCollection<TData extends Record<string, any> = Record<string, unknown>> {
	entries: Array<LiveDataEntry<TData>>;
	/** A hint for how to cache this collection. Individual entries can also have cache hints */
	cacheHint?: CacheHint;
}

export interface LiveDataCollectionResult<
	TData extends Record<string, any> = Record<string, unknown>,
	TError extends Error = Error,
> {
	entries?: Array<LiveDataEntry<TData>>;
	error?: TError | LiveCollectionError;
	cacheHint?: CacheHint;
}

export interface LiveDataEntryResult<
	TData extends Record<string, any> = Record<string, unknown>,
	TError extends Error = Error,
> {
	entry?: LiveDataEntry<TData>;
	error?: TError | LiveCollectionError;
	cacheHint?: CacheHint;
}
