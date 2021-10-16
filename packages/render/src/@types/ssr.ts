import { Astro as AstroGlobal, TopLevelAstro } from './astro-file';
import { Renderer } from './astro';

export interface SSRMetadata {
  renderers: Renderer[];
}

export interface SSRResult {
  styles: Set<string>;
  scripts: Set<string>;
  createAstro(Astro: TopLevelAstro, props: Record<string, any>, slots: Record<string, any> | null): AstroGlobal;
  _metadata: SSRMetadata;
}
