export {};

declare global {
  interface ImportMeta {
      hot: {
          accept: Function;
          dispose: Function;
      };
      env: Record<string, string>;
  }
}

type AstroRenderedHTML = string;

type FetchContentResult<ContentFrontmatter extends Record<string, any> = Record<string, any>> = {
  astro: {
    headers: string[];
    source: string;
    html: AstroRenderedHTML;
  };
  url: URL;
} & ContentFrontmatter;

export type Params = Record<string, string | undefined>;

interface AstroPageRequest {
  url: URL;
  canonicalURL: URL;
  params: Params;
}

interface AstroBuiltinProps {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:media'?: string;
  'client:visible'?: boolean;
}

interface Astro {
  isPage: boolean;
  fetchContent<ContentFrontmatter>(globStr: string): FetchContentResult<ContentFrontmatter>[];
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  site: URL;
}

declare const Astro: Astro;