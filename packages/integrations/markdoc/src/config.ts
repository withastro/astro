import type { AstroInstance } from 'astro';
import type {
	ConfigType as MarkdocConfig,
	Config,
	NodeType,
	Schema,
	MaybePromise,
} from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import { heading } from './heading-ids.js';

type Render = AstroInstance['default'] | string;

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

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, heading };

export function defineMarkdocConfig(config: AstroMarkdocConfig): AstroMarkdocConfig {
	return config;
}
