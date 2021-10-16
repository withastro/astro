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

export type Params = Record<string, string | undefined>;

interface AstroPageRequest {
  url: URL;
  canonicalURL: URL;
  params: Params;
}

export interface AstroBuiltinProps {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:media'?: string;
  'client:visible'?: boolean;
}

export interface TopLevelAstro {
  isPage: boolean;
  fetchContent<T = any>(globStr: string): Promise<FetchContentResult<T>[]>;
  resolve: (path: string) => string;
  site: URL;
}

export interface Astro extends TopLevelAstro {
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  slots: Record<string, true | undefined>;
}