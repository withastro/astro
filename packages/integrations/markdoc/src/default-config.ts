import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import type { ContentEntryModule } from 'astro';

export function applyDefaultConfig({
	config,
	entry,
}: {
	config: MarkdocConfig;
	entry: ContentEntryModule;
}): MarkdocConfig {
	return {
		...config,
		variables: {
			entry,
			...config.variables,
		},
		// TODO: heading ID calculation, Shiki syntax highlighting
	};
}
