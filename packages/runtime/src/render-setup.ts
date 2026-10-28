import { AstroError, AstroErrorData } from './core/errors/index.js';
import type { AstroComponentFactory } from './types.js';
import {
	createRenderer,
	type Renderer,
	type RendererOptions,
	type RenderOptions,
} from './render.js';

let registeredRenderer: Renderer | undefined;

/**
 * Sets the configuration that `renderToString()` and `renderToResponse()` render with, replacing
 * any earlier one. `astro()` calls it from `virtual:astro:render-setup`, which every component it
 * compiles for a server environment imports.
 */
export function setRenderConfig(options: RendererOptions): void {
	registeredRenderer = createRenderer(options);
}

function getRegisteredRenderer(): Renderer {
	if (!registeredRenderer) {
		throw new AstroError(AstroErrorData.RenderNotConfigured);
	}
	return registeredRenderer;
}

/**
 * Renders a `.astro` component compiled by `astro()` to a `Response`.
 *
 * @throws {AstroError} `RenderNotConfigured` when no component compiled by `astro()` has been
 * loaded in this module graph. Use `createRenderer()` for components compiled otherwise.
 */
export async function renderToResponse(
	Component: AstroComponentFactory,
	options?: RenderOptions,
): Promise<Response> {
	return getRegisteredRenderer().renderToResponse(Component, options);
}

/**
 * Renders a `.astro` component compiled by `astro()` to an HTML string. See `renderToResponse()`.
 */
export async function renderToString(
	Component: AstroComponentFactory,
	options?: RenderOptions,
): Promise<string> {
	return getRegisteredRenderer().renderToString(Component, options);
}
