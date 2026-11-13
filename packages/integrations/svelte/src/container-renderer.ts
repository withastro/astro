import { reexportRenderer } from '@astrojs/internal-helpers/renderer';
import type { AstroRenderer } from 'astro';
import { getContainerRenderer as getRendererPackageContainerRenderer } from '@astrojs/svelte-renderer/container-renderer';

const fromRendererPackage = (renderer: AstroRenderer) =>
	reexportRenderer(renderer, '@astrojs/svelte-renderer', '@astrojs/svelte');

export function getContainerRenderer(): AstroRenderer {
	return fromRendererPackage(getRendererPackageContainerRenderer());
}
