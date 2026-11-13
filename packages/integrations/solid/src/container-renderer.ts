import { reexportRenderer } from '@astrojs/internal-helpers/renderer';
import type { AstroRenderer } from 'astro';
import { getContainerRenderer as getRendererPackageContainerRenderer } from '@astrojs/solid-js-renderer/container-renderer';

const fromRendererPackage = (renderer: AstroRenderer) =>
	reexportRenderer(renderer, '@astrojs/solid-js-renderer', '@astrojs/solid-js');

export function getContainerRenderer(): AstroRenderer {
	return fromRendererPackage(getRendererPackageContainerRenderer());
}
