import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
export { default as Markdoc } from '@markdoc/markdoc';

export function defineMarkdocConfig(config: MarkdocConfig): MarkdocConfig {
	return config;
}
