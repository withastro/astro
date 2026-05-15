import { type PreactPluginOptions as VitePreactPluginOptions } from '@preact/preset-vite';
import type { AstroIntegration, AstroRenderer } from 'astro';
export declare const getContainerRenderer: () => AstroRenderer;
export interface Options extends Pick<VitePreactPluginOptions, 'include' | 'exclude' | 'babel'> {
	compat?: boolean;
	devtools?: boolean;
}
export default function ({ include, exclude, compat, devtools, babel }?: Options): AstroIntegration;
