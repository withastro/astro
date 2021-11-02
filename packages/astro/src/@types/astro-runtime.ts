import type { Renderer } from './astro-core';

export interface AstroBuiltinProps {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:media'?: string;
  'client:visible'?: boolean;
}

export interface AstroGlobal extends TopLevelAstro {
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  slots: Record<string, true | undefined>;
}

interface AstroPageRequest {
  url: URL;
  canonicalURL: URL;
  params: Params;
}

type AstroRenderedHTML = string;

export type FetchContentResultBase = {
  astro: {
    headers: string[];
    source: string;
    html: AstroRenderedHTML;
  };
  url: URL;
};

export type FetchContentResult<T> = FetchContentResultBase & T;

export interface HydrateOptions {
  value?: string;
}

export type GetHydrateCallback = () => Promise<(element: Element, innerHTML: string | null) => void>;

export type Params = Record<string, string | undefined>;

export interface TopLevelAstro {
  fetchContent<T = any>(globStr: string): Promise<FetchContentResult<T>[]>;
  resolve: (path: string) => string;
  site: URL;
}

export interface SSRMetadata {
  renderers: Renderer[];
}

export interface SSRResult {
  styles: Set<SSRElement>;
  scripts: Set<SSRElement>;
  createAstro(Astro: TopLevelAstro, props: Record<string, any>, slots: Record<string, any> | null): AstroGlobal;
  _metadata: SSRMetadata;
}

export interface SSRElement {
  props: Record<string, any>;
  children: string;
}
