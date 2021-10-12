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

export interface Astro {
  isPage: boolean;
  fetchContent<T = any>(globStr: string): Promise<FetchContentResult<T>[]>;
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  resolve: (path: string) => string;
  site: URL;
  slots: Record<string, true | undefined>;
}