type AstroRenderedHTML = string;

interface FetchContentResult {
  astro: {
    headers: string[];
    source: string;
    html: AstroRenderedHTML;
  };
  url: URL;
  [key: string]: any;
}

interface AstroPageRequest {
  url: URL;
  canonicalURL: URL;
}

interface Astro {
  isPage: boolean;
  fetchContent(globStr: string): FetchContentResult[];
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  site: URL;
}

declare const Astro: Astro;

export default function(): string;