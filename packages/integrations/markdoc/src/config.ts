import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import _Markdoc from '@markdoc/markdoc';
import { nodes as astroNodes } from './nodes/index.js';

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, ...astroNodes };

export function defineMarkdocConfig(config: MarkdocConfig): MarkdocConfig {
	return config;
}
