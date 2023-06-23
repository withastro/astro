import type {
	Config,
	ConfigType as MarkdocConfig,
	MaybePromise,
	NodeType,
	Schema,
} from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import { heading } from './heading-ids.js';
import { isRelativePath } from '@astrojs/internal-helpers/path';
import type { AstroInstance } from 'astro';

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

export function component(
	// TODO: generate suggestions
	pathnameOrPkgName: StringWithSuggestions<'./src/components/Aside.astro'>,
	namedExport?: string
): ComponentConfig {
	return {
		type: isNpmPackageName(pathnameOrPkgName) ? 'package' : 'local',
		path: pathnameOrPkgName,
		namedExport,
		[componentConfigSymbol]: true,
	};
}

function isNpmPackageName(pathname: string) {
	return !isRelativePath(pathname) && !pathname.startsWith('/');
}

export function isComponentConfig(value: unknown): value is ComponentConfig {
	return typeof value === 'object' && value !== null && componentConfigSymbol in value;
}

const componentConfigSymbol = Symbol.for('@astrojs/markdoc/component-config');
