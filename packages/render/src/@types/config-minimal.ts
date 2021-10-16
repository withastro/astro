import type { Renderer } from './astro';

export interface AstroConfigMinimal {
  /** production website, needed for some RSS & Sitemap functions */
  site: string;
  /** Renderers for SSR */
  renderers?: Renderer[];
}
