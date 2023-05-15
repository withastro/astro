import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import * as astroDefaultNodes from './nodes/index.js';
import _Markdoc from '@markdoc/markdoc';

export const Markdoc = _Markdoc;
export const defaultNodes = { ...Markdoc.nodes, ...astroDefaultNodes };

export function defineMarkdocConfig(config: MarkdocConfig): MarkdocConfig {
	return config;
}
