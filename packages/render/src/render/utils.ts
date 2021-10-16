import type { TopLevelAstro, Astro as AstroGlobal } from '../@types/astro-file'
import type { SSRResult } from '../@types/ssr';
import type { Renderer } from '../@types/astro';
import type { AstroConfigMinimal } from '../@types/config-minimal'
import type { AstroComponentFactory, AstroComponent } from '../internal';

import { defineStyleVars, defineScriptVars, spreadAttributes } from '../internal/index.js';

export interface CreateResultOptions {
  /** production website, needed for some RSS & Sitemap functions */
  origin: string;
  /** the web request (needed for dynamic routes) */
  pathname: string;
  renderers?: Renderer[];
}

export function createResult({ site: origin, renderers = [] }: AstroConfigMinimal, req: { url: string }): SSRResult {
  const result: SSRResult = {
      styles: new Set(),
      scripts: new Set(),
      /** This function returns the `Astro` faux-global */
      createAstro(astroGlobal: TopLevelAstro, props: Record<string, any>, slots: Record<string, any> | null) {
        const site = new URL(origin);
        const url = new URL(req.url);
        const canonicalURL = getCanonicalURL(url.pathname, origin);

        return {
          __proto__: astroGlobal,
          props,
          request: {
            canonicalURL,
            params: {},
            url,
          },
          slots: Object.fromEntries(Object.entries(slots || {}).map(([slotName]) => [slotName, true])),
        } as unknown as AstroGlobal;
      },
      _metadata: { renderers },
    };
    return result;
}

// Polyfill `path.extname` for non-Node environments
function extname(path: string) {
  const tmp = /(\.[^.\/]*|)(?:[\/]*)$/.exec(path) || [path, ''];
  return tmp.slice(1)[0];
}

/** Normalize URL to its canonical form */
function getCanonicalURL(url: string, base?: string): URL {
  let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
  pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
  if (!extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
  pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
  return new URL(pathname, base);
}

export class AstroElement {
  private attributes: Record<string|number, any>;
  private code: string;

  constructor(private name: string, _props: Record<string|number, any>, children: string = '') {
    const { hoist: _, 'define:vars': defineVars, ...props } = _props;
    this.attributes = props;

    if (defineVars) {
      if (name === 'style') {
        children = defineStyleVars(props['data-astro-id'], defineVars) + '\n' + children;
      }
      if (name === 'script') {
        children = defineScriptVars(defineVars) + '\n' + children;
      }
    }

    this.code = children;
  }

  toString() {
    return `<${this.name}${spreadAttributes(this.attributes)}>${this.code}</${this.name}>`
  }
}

export async function renderAstroComponent(component: InstanceType<typeof AstroComponent>) {
  let template = '';

  for await (const value of component) {
    if (value || value === 0) {
      template += value;
    }
  }

  return template;
}

export async function renderToString(result: SSRResult, componentFactory: AstroComponentFactory, props: Record<string|number, any>, slots: Record<string, AstroComponentFactory>|null = null) {
  const Component = await componentFactory(result, props, slots);
  const template = await renderAstroComponent(Component);
  return template;
}
