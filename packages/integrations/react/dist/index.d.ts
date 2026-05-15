import { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, AstroRenderer } from 'astro';
export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
	/**
	 * Disable streaming in React components
	 */
	experimentalDisableStreaming?: boolean;
};
export default function ({
	include,
	exclude,
	babel,
	experimentalReactChildren,
	experimentalDisableStreaming,
}?: ReactIntegrationOptions): AstroIntegration;
export declare function getContainerRenderer(): AstroRenderer;
