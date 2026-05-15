import type { AstroConfig, ContentEntryType } from 'astro';
import type { MarkdocConfigResult } from './load-config.js';
import type { MarkdocIntegrationOptions } from './options.js';
export declare function getContentEntryType({
	markdocConfigResult,
	astroConfig,
	options,
}: {
	astroConfig: AstroConfig;
	markdocConfigResult?: MarkdocConfigResult;
	options?: MarkdocIntegrationOptions;
}): Promise<ContentEntryType>;
