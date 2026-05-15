import type { AstroConfig } from 'astro';
import type { AstroMarkdocConfig } from './config.js';
export declare const SUPPORTED_MARKDOC_CONFIG_FILES: string[];
export type MarkdocConfigResult = {
	config: AstroMarkdocConfig;
	fileUrl: URL;
};
export declare function loadMarkdocConfig(
	astroConfig: Pick<AstroConfig, 'root'>,
): Promise<MarkdocConfigResult | undefined>;
