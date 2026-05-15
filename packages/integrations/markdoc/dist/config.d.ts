import type {
	Config,
	ConfigType as MarkdocConfig,
	MaybePromise,
	NodeType,
	Schema,
} from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';
import { componentConfigSymbol } from './utils.js';
export type Render = ComponentConfig | AstroInstance['default'] | string;
export type ComponentConfig = {
	type: 'package' | 'local';
	path: string;
	namedExport?: string;
	[componentConfigSymbol]: true;
};
export type AstroMarkdocConfig<C extends Record<string, any> = Record<string, any>> = Omit<
	MarkdocConfig,
	'tags' | 'nodes'
> &
	Partial<{
		tags: Record<string, Schema<Config, Render>>;
		nodes: Partial<Record<NodeType, Schema<Config, Render>>>;
		ctx: C;
		extends: MaybePromise<ResolvedAstroMarkdocConfig>[];
	}>;
export type ResolvedAstroMarkdocConfig = Omit<AstroMarkdocConfig, 'extends'>;
export declare const Markdoc: typeof _Markdoc;
export declare const nodes: {
	heading: Schema;
	document: Schema;
	paragraph: Schema;
	image: Schema;
	fence: Schema;
	blockquote: Schema;
	item: Schema;
	list: Schema;
	hr: Schema;
	table: Schema;
	td: Schema;
	th: Schema;
	tr: Schema;
	tbody: Schema;
	thead: Schema;
	strong: Schema;
	em: Schema;
	s: Schema;
	inline: Schema;
	link: Schema;
	code: Schema;
	text: Schema;
	hardbreak: Schema;
	softbreak: Schema;
	comment: {
		attributes: {
			content: {
				type: StringConstructor;
				required: boolean;
			};
		};
	};
	error: {};
	node: {};
};
export declare function defineMarkdocConfig(config: AstroMarkdocConfig): AstroMarkdocConfig;
export declare function component(pathnameOrPkgName: string, namedExport?: string): ComponentConfig;
