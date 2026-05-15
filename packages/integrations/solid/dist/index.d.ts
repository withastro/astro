import type { AstroIntegration, AstroRenderer } from 'astro';
import { type Options as ViteSolidPluginOptions } from 'vite-plugin-solid';
declare function getRenderer(): AstroRenderer;
export { getRenderer as getContainerRenderer };
export interface Options extends Pick<ViteSolidPluginOptions, 'include' | 'exclude'> {
	devtools?: boolean;
}
export default function (options?: Options): AstroIntegration;
