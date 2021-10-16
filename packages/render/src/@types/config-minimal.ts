import type { Renderer } from './astro';

export interface AstroConfigMinimal {
  /** production website, needed for some RSS & Sitemap functions */
  origin: string;
  /** the web request (needed for dynamic routes) */
  pathname?: string;
  /** Renderers for SSR */
  renderers?: Renderer[];
}
