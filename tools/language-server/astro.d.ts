type AstroRenderedHTML = string;

type FetchContentResult<ContentFrontmatter extends Record<string, any> = Record<string, any>> = {
  astro: {
    headers: string[];
    source: string;
    html: AstroRenderedHTML;
  };
  url: URL;
} & ContentFrontmatter;

interface AstroPageRequest {
  url: URL;
  canonicalURL: URL;
}

interface Astro {
  isPage: boolean;
  fetchContent<ContentFrontmatter>(globStr: string): FetchContentResult<ContentFrontmatter>[];
  props: Record<string, number | string | any>;
  request: AstroPageRequest;
  site: URL;
}

declare const Astro: Astro;

export default function (): string;
