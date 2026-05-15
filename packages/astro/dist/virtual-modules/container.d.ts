import type { AstroRenderer } from '../types/public/integrations.js';
import type { SSRLoadedRenderer } from '../types/public/internal.js';
/**
 * Use this function to provide renderers to the `AstroContainer`:
 *
 * ```js
 * import { getContainerRenderer } from "@astrojs/react";
 * import { experimental_AstroContainer as AstroContainer } from "astro/container";
 * import { loadRenderers } from "astro:container"; // use this only when using vite/vitest
 *
 * const renderers = await loadRenderers([ getContainerRenderer ]);
 * const container = await AstroContainer.create({ renderers });
 *
 * ```
 * @param renderers
 */
export declare function loadRenderers(renderers: AstroRenderer[]): Promise<SSRLoadedRenderer[]>;
