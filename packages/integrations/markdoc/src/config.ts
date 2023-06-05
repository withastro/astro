import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import { heading } from './heading-ids.js';
import type { MaybePromise } from './utils.js';

export type AstroMarkdocConfig<C extends Record<string, any> = Record<string, any>> =
	MarkdocConfig & {
		ctx?: C;
		extends?: MaybePromise<ResolvedAstroMarkdocConfig>[];
	};

export type ResolvedAstroMarkdocConfig = Omit<AstroMarkdocConfig, 'extends'>;

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, heading };

export function defineMarkdocConfig(config: AstroMarkdocConfig): AstroMarkdocConfig {
	return config;
}
