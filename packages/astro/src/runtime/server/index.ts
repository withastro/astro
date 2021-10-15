import type { AstroComponentMetadata } from '../../@types/astro';
import type { SSRResult } from '../../@types/ssr';
import type { TopLevelAstro } from '../../@types/astro-file';

import { pathToFileURL } from 'url';
import { valueToEstree } from 'estree-util-value-to-estree';
import * as astring from 'astring';
import shorthash from 'shorthash';
export { createHydrationMap } from './hydration-map.js';

const { generate, GENERATOR } = astring;

// A more robust version alternative to `JSON.stringify` that can handle most values
// see https://github.com/remcohaszing/estree-util-value-to-estree#readme
const customGenerator: astring.Generator = {
  ...GENERATOR,
  Literal(node, state) {
    if (node.raw != null) {
      // escape closing script tags in strings so browsers wouldn't interpret them as
      // closing the actual end tag in HTML
      state.write(node.raw.replace('</script>', '<\\/script>'));
    } else {
      GENERATOR.Literal(node, state);
    }
  },
};
const serialize = (value: any) =>
  generate(valueToEstree(value), {
    generator: customGenerator,
  });

async function _render(child: any): Promise<any> {
  child = await child;
  if (Array.isArray(child)) {
    return (await Promise.all(child.map((value) => _render(value)))).join('\n');
  } else if (typeof child === 'function') {
    // Special: If a child is a function, call it automatically.
    // This lets you do {() => ...} without the extra boilerplate
    // of wrapping it in a function and calling it.
    return _render(child());
  } else if (typeof child === 'string') {
    return child;
  } else if (!child && child !== 0) {
    // do nothing, safe to ignore falsey values.
  } else if (child instanceof AstroComponent) {
    return await renderAstroComponent(child);
  } else {
    return child;
  }
}

export class AstroComponent {
  private htmlParts: TemplateStringsArray;
  private expressions: any[];

  constructor(htmlParts: TemplateStringsArray, expressions: any[]) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }

  *[Symbol.iterator]() {
    const { htmlParts, expressions } = this;

    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];

      yield _render(html);
      yield _render(expression);
    }
  }
}

export async function render(htmlParts: TemplateStringsArray, ...expressions: any[]) {
  return new AstroComponent(htmlParts, expressions);
}

export interface AstroComponentFactory {
  (result: any, props: any, slots: any): ReturnType<typeof render>;
  isAstroComponentFactory?: boolean;
}

export function createComponent(cb: AstroComponentFactory) {
  // Add a flag to this callback to mark it as an Astro component
  (cb as any).isAstroComponentFactory = true;
  return cb;
}

interface ExtractedHydration {
  hydration: {
    directive: string;
    value: string;
    componentUrl: string;
    componentExport: { value: string };
  } | null;
  props: Record<string | number, any>;
}

function extractHydrationDirectives(inputProps: Record<string | number, any>): ExtractedHydration {
  let extracted: ExtractedHydration = {
    hydration: null,
    props: {},
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith('client:')) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: '',
          value: '',
          componentUrl: '',
          componentExport: { value: '' },
        };
      }
      switch (key) {
        case 'client:component-path': {
          extracted.hydration.componentUrl = value;
          break;
        }
        case 'client:component-export': {
          extracted.hydration.componentExport.value = value;
          break;
        }
        default: {
          extracted.hydration.directive = key.split(':')[1];
          extracted.hydration.value = value;
          break;
        }
      }
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}

interface HydrateScriptOptions {
  renderer: any;
  astroId: string;
  props: any;
}

/** For hydrated components, generate a <script type="module"> to load the component */
async function generateHydrateScript(scriptOptions: HydrateScriptOptions, metadata: Required<AstroComponentMetadata>) {
  const { renderer, astroId, props } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;

  if (!componentExport) {
    throw new Error(`Unable to resolve a componentExport for "${metadata.displayName}"! Please open an issue.`);
  }

  let hydrationSource = '';
  if (renderer.hydrationPolyfills) {
    hydrationSource += `await Promise.all([${renderer.hydrationPolyfills.map((src: string) => `\n  import("${src}")`).join(', ')}]);\n`;
  }

  hydrationSource += renderer.source
    ? `const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${componentUrl}"), import("${renderer.source}")]);
  return (el, children) => hydrate(el)(Component, ${serialize(props)}, children);
`
    : `await import("${componentUrl}");
  return () => {};
`;

  const hydrationScript = `<script type="module">
import setup from 'astro/client/${hydrate}.js';
setup("${astroId}", {${metadata.hydrateArgs ? `value: ${JSON.stringify(metadata.hydrateArgs)}` : ''}}, async () => {
  ${hydrationSource}
});
</script>
`;

  return hydrationScript;
}

export async function renderSlot(result: any, slotted: string, fallback?: any) {
  if (slotted) {
    return _render(slotted);
  }
  return fallback;
}

export async function renderComponent(result: SSRResult, displayName: string, Component: unknown, _props: Record<string | number, any>, slots: any = {}) {
  Component = await Component;
  const children = await renderSlot(result, slots?.default);
  const { renderers } = result._metadata;

  if (Component && (Component as any).isAstroComponentFactory) {
    const output = await renderToString(result, Component as any, _props, slots);
    return output;
  }

  let metadata: AstroComponentMetadata = { displayName };

  if (Component == null) {
    throw new Error(`Unable to render ${metadata.displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`);
  }

  const { hydration, props } = extractHydrationDirectives(_props);
  let html = '';

  if (hydration) {
    metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }

  let renderer = null;
  for (const r of renderers) {
    if (await r.ssr.check(Component, props, children)) {
      renderer = r;
    }
  }

  if (renderer === null) {
    if (typeof Component === 'string') {
      html = await renderAstroComponent(await render`<${Component}${spreadAttributes(props)}>${children}</${Component}>`);
    } else {
      throw new Error(`Astro is unable to render ${metadata.displayName}!\nIs there a renderer to handle this type of component defined in your Astro config?`);
    }
  } else {
    ({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children));
  }

  if (renderer?.polyfills?.length) {
    let polyfillScripts = renderer.polyfills.map((src) => `<script type="module">import "${src}";</script>`).join('');
    html = html + polyfillScripts;
  }

  if (!hydration) {
    return html.replace(/\<\/?astro-fragment\>/g, '');
  }

  const astroId = shorthash.unique(html);

  result.scripts.add(await generateHydrateScript({ renderer, astroId, props }, metadata as Required<AstroComponentMetadata>));

  return `<astro-root uid="${astroId}">${html}</astro-root>`;
}

/** Create the Astro.fetchContent() runtime function. */
function createFetchContentFn(url: URL) {
  const fetchContent = (importMetaGlobResult: Record<string, any>) => {
    let allEntries = [...Object.entries(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`[${url.pathname}] Astro.fetchContent() no matches found.`);
    }
    return allEntries
      .map(([spec, mod]) => {
        // Only return Markdown files for now.
        if (!mod.frontmatter) {
          return;
        }
        const urlSpec = new URL(spec, url).pathname.replace(/[\\/\\\\]/, '/');
        return {
          content: mod.metadata,
          metadata: mod.frontmatter,
          file: new URL(spec, url),
          url: urlSpec.includes('/pages/') && urlSpec.replace(/^.*\/pages\//, '/').replace(/\.md$/, ''),
        };
      })
      .filter(Boolean);
  };
  return fetchContent;
}

export function createAstro(fileURLStr: string, site: string): TopLevelAstro {
  const url = pathToFileURL(fileURLStr);
  const fetchContent = createFetchContentFn(url) as unknown as TopLevelAstro['fetchContent'];
  return {
    // TODO I think this is no longer needed.
    isPage: false,
    site: new URL(site),
    fetchContent,
    resolve(...segments) {
      return segments.reduce((u, segment) => new URL(segment, u), url).pathname;
    },
  };
}

export function addAttribute(value: any, key: string) {
  if (value == null || value === false) {
    return '';
  }
  return ` ${key}="${value}"`;
}

export function spreadAttributes(values: Record<any, any>) {
  let output = '';
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key);
  }
  return output;
}

export function defineStyleVars(astroId: string, vars: Record<any, any>) {
  let output = '\n';
  for (const [key, value] of Object.entries(vars)) {
    output += `  --${key}: ${value};\n`;
  }
  return `.${astroId} {${output}}`;
}

export function defineScriptVars(vars: Record<any, any>) {
  let output = '';
  for (const [key, value] of Object.entries(vars)) {
    output += `let ${key} = ${JSON.stringify(value)};\n`;
  }
  return output;
}

export async function renderToString(result: any, componentFactory: AstroComponentFactory, props: any, children: any) {
  const Component = await componentFactory(result, props, children);
  let template = await renderAstroComponent(Component);
  return template;
}

export async function renderPage(result: any, Component: AstroComponentFactory, props: any, children: any) {
  const template = await renderToString(result, Component, props, children);
  const styles = Array.from(result.styles).map((style: any) => renderElement('style', style));
  const scripts = Array.from(result.scripts);
  return template.replace('</head>', styles.join('\n') + scripts.join('\n') + '</head>');
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

function renderElement(name: string, { props: _props, children = '' }: { props: Record<any, any>; children?: string }) {
  const { hoist: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
  if (defineVars) {
    if (name === 'style') {
      children = defineStyleVars(astroId, defineVars) + '\n' + children;
    }
    if (name === 'script') {
      children = defineScriptVars(defineVars) + '\n' + children;
    }
  }
  return `<${name}${spreadAttributes(props)}>${children}</${name}>`;
}
