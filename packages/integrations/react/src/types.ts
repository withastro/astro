import type { FilterPattern } from 'vite';
import type { SSRResult } from 'astro';

export type RendererContext = {
	result: SSRResult;
};

export type VirtualModuleOptions = {
	include?: FilterPattern;
	exclude?: FilterPattern;
	experimentalReactChildren?: boolean;
	experimentalDisableStreaming?: boolean;
};
