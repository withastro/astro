import { reexportRenderer } from '@astrojs/internal-helpers/renderer';
import type { AstroRenderer } from 'astro';
import { getContainerRenderer as getRendererPackageContainerRenderer } from '@astrojs/vue-renderer/container-renderer';

const fromRendererPackage = (renderer: AstroRenderer) =>
	reexportRenderer(renderer, '@astrojs/vue-renderer', '@astrojs/vue');

export function getContainerRenderer(): AstroRenderer {
	return fromRendererPackage(getRendererPackageContainerRenderer());
}
