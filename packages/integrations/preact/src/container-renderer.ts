import { reexportRenderer } from '@astrojs/internal-helpers/renderer';
import type { AstroRenderer } from 'astro';
import {
	getContainerRenderer as getRendererPackageContainerRenderer,
	getRenderer as getRendererPackageRenderer,
} from '@astrojs/preact-renderer/container-renderer';

const fromRendererPackage = (renderer: AstroRenderer) =>
	reexportRenderer(renderer, '@astrojs/preact-renderer', '@astrojs/preact');

export function getRenderer(...args: Parameters<typeof getRendererPackageRenderer>): AstroRenderer {
	return fromRendererPackage(getRendererPackageRenderer(...args));
}

export function getContainerRenderer(): AstroRenderer {
	return fromRendererPackage(getRendererPackageContainerRenderer());
}
