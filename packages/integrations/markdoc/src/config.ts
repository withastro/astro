import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import { nodes as astroNodes } from './nodes/index.js';
import _Markdoc from '@markdoc/markdoc';

export const Markdoc = _Markdoc;
export const nodes = { ...Markdoc.nodes, ...astroNodes };

export function defineMarkdocConfig(config: MarkdocConfig): MarkdocConfig {
	return config;
}
