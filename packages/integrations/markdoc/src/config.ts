import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import { nodes as astroNodes } from './nodes/index.js';

export type AstroMarkdocConfig<C extends Record<string, any> = Record<string, any>> =
	MarkdocConfig & {
		ctx?: C;
		extends?: ResolvedAstroMarkdocConfig[];
	};

export type ResolvedAstroMarkdocConfig = Omit<AstroMarkdocConfig, 'extends'>;

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, ...astroNodes };
export { shiki } from './nodes/fence.js';

export function defineMarkdocConfig(config: AstroMarkdocConfig): AstroMarkdocConfig {
	return config;
}
