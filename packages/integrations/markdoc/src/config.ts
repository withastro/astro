import type {
	Config,
	ConfigType as MarkdocConfig,
	MaybePromise,
	NodeType,
	Schema,
} from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';
import { heading } from './heading-ids.js';
import { isRelativePath } from '@astrojs/internal-helpers/path';

export type Render = AstroInstance['default'] | ComponentConfig | string;
export type ComponentConfig = {
	isComponentConfig: true;
	path: string;
	namedExport?: string;
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

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, heading };

export function defineMarkdocConfig(config: AstroMarkdocConfig): AstroMarkdocConfig {
	return config;
}

/**
 * Allow any string, but offer other suggestions with intellisense (`TSuggestions`).
 * The `& {}` preserves hints when union-ing with `string`
 * @see 'https://twitter.com/anthonysheww/status/1670457592638763008'
 */
type StringWithSuggestions<TSuggestions extends string> = TSuggestions | (string & {});

export function isComponentConfig(value: unknown): value is ComponentConfig {
	return typeof value === 'object' && value !== null && 'isComponentConfig' in value;
}

export function component(
	// TODO: generate suggestions
	pathnameOrPkgName: StringWithSuggestions<'./src/components/Aside.astro'>,
	// TODO: generate base url
	baseUrl: URL,
	namedExport?: string
): ComponentConfig {
	if (isNpmPackageName(pathnameOrPkgName)) {
		return {
			isComponentConfig: true,
			path: pathnameOrPkgName,
			namedExport,
		};
	} else {
		return {
			isComponentConfig: true,
			path: new URL(pathnameOrPkgName, baseUrl).pathname,
			namedExport,
		};
	}
}

function isNpmPackageName(pathname: string) {
	return !isRelativePath(pathname) && !pathname.startsWith('/');
}
