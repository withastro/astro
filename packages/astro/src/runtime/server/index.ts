import type { AstroComponentMetadata, Renderer } from '../../@types/astro-core';
import type { SSRResult, SSRElement } from '../../@types/astro-runtime';
import type { TopLevelAstro } from '../../@types/astro-runtime';

import shorthash from 'shorthash';
import { extractDirectives, generateHydrateScript } from './hydration.js';
import { serializeListValue } from './util.js';
export { createMetadata } from './metadata.js';

// INVESTIGATE:
// 2. Less anys when possible and make it well known when they are needed.

// Used to render slots and expressions
// INVESTIGATE: Can we have more specific types both for the argument and output?
// If these are intentional, add comments that these are intention and why.
// Or maybe type UserValue = any; ?
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
  }
  // Add a comment explaining why each of these are needed.
  // Maybe create clearly named function for what this is doing.
  else if (child instanceof AstroComponent || child.toString() === '[object AstroComponent]') {
    return await renderAstroComponent(child);
  } else {
    return child;
  }
}

// The return value when rendering a component.
// This is the result of calling render(), should this be named to RenderResult or...?
export class AstroComponent {
  private htmlParts: TemplateStringsArray;
  private expressions: any[];

  constructor(htmlParts: TemplateStringsArray, expressions: any[]) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }

  get [Symbol.toStringTag]() {
    return 'AstroComponent';
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

// The callback passed to to $$createComponent
export interface AstroComponentFactory {
  (result: any, props: any, slots: any): ReturnType<typeof render>;
  isAstroComponentFactory?: boolean;
}

// Used in creating the component. aka the main export.
export function createComponent(cb: AstroComponentFactory) {
  // Add a flag to this callback to mark it as an Astro component
  // INVESTIGATE does this need to cast
  (cb as any).isAstroComponentFactory = true;
  return cb;
}

export async function renderSlot(_result: any, slotted: string, fallback?: any) {
  if (slotted) {
    return _render(slotted);
  }
  return fallback;
}

export const Fragment = Symbol('Astro.Fragment');

export async function renderComponent(result: SSRResult, displayName: string, Component: unknown, _props: Record<string | number, any>, slots: any = {}) {
  Component = await Component;
  const children = await renderSlot(result, slots?.default);
  const { renderers } = result._metadata;

  if (Component === Fragment) {
    return children;
  }

  if (Component && (Component as any).isAstroComponentFactory) {
    const output = await renderToString(result, Component as any, _props, slots);
    return output;
  }

  let metadata: AstroComponentMetadata = { displayName };

  if (Component == null) {
    throw new Error(`Unable to render ${metadata.displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`);
  }

  const { hydration, props } = extractDirectives(_props);
  let html = '';

  if (hydration) {
    metadata.hydrate = hydration.directive as AstroComponentMetadata['hydrate'];
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }

  // Call the renderers `check` hook to see if any claim this component.
  let renderer: Renderer | undefined;
  for (const r of renderers) {
    if (await r.ssr.check(Component, props, children)) {
      renderer = r;
      break;
    }
  }

  // If no one claimed the renderer
  if (!renderer) {
    // This is a custom element without a renderer. Because of that, render it
    // as a string and the user is responsible for adding a script tag for the component definition.
    if (typeof Component === 'string') {
      html = await renderAstroComponent(await render`<${Component}${spreadAttributes(props)}>${children}</${Component}>`);
    } else {
      throw new Error(`Astro is unable to render ${metadata.displayName}!\nIs there a renderer to handle this type of component defined in your Astro config?`);
    }
  } else {
    ({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children));
  }

  // This is used to add polyfill scripts to the page, if the renderer needs them.
  if (renderer?.polyfills?.length) {
    let polyfillScripts = renderer.polyfills.map((src) => `<script type="module">import "${src}";</script>`).join('');
    html = html + polyfillScripts;
  }

  if (!hydration) {
    return html.replace(/\<\/?astro-fragment\>/g, '');
  }

  // Include componentExport name and componentUrl in hash to dedupe identical islands
  const astroId = shorthash.unique(`<!--${metadata.componentExport!.value}:${metadata.componentUrl}-->\n${html}`);

  // Rather than appending this inline in the page, puts this into the `result.scripts` set that will be appended to the head.
  // INVESTIGATE: This will likely be a problem in streaming because the `<head>` will be gone at this point.
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
        const urlSpec = new URL(spec, url).pathname;
        return {
          ...mod.frontmatter,
          content: mod.metadata,
          file: new URL(spec, url),
          url: urlSpec.includes('/pages/') ? urlSpec.replace(/^.*\/pages\//, '/').replace(/(\/index)?\.md$/, '') : undefined,
        };
      })
      .filter(Boolean);
  };
  // This has to be cast because the type of fetchContent is the type of the function
  // that receives the import.meta.glob result, but the user is using it as
  // another type.
  return fetchContent as unknown as TopLevelAstro['fetchContent'];
}

// This is used to create the top-level Astro global; the one that you can use
// Inside of getStaticPaths.
export function createAstro(fileURLStr: string, site: string): TopLevelAstro {
  const url = new URL(fileURLStr);
  const fetchContent = createFetchContentFn(url);
  return {
    site: new URL(site),
    fetchContent,
    // INVESTIGATE is there a use-case for multi args?
    resolve(...segments: string[]) {
      return segments.reduce((u, segment) => new URL(segment, u), url).pathname;
    },
  };
}

const toAttributeString = (value: any) => String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;');

// A helper used to turn expressions into attribute key/value
export function addAttribute(value: any, key: string) {
  if (value == null || value === false) {
    return '';
  }

  // support "class" from an expression passed into an element (#782)
  if (key === 'class:list') {
    return ` ${key.slice(0, -5)}="${toAttributeString(serializeListValue(value))}"`;
  }

  return ` ${key}="${toAttributeString(value)}"`;
}

// Adds support for `<Component {...value} />
export function spreadAttributes(values: Record<any, any>) {
  let output = '';
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key);
  }
  return output;
}

// Adds CSS variables to an inline style tag
export function defineStyleVars(selector: string, vars: Record<any, any>) {
  let output = '\n';
  for (const [key, value] of Object.entries(vars)) {
    output += `  --${key}: ${value};\n`;
  }
  return `${selector} {${output}}`;
}

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
  let output = '';
  for (const [key, value] of Object.entries(vars)) {
    output += `let ${key} = ${JSON.stringify(value)};\n`;
  }
  return output;
}

// Calls a component and renders it into a string of HTML
export async function renderToString(result: SSRResult, componentFactory: AstroComponentFactory, props: any, children: any) {
  const Component = await componentFactory(result, props, children);
  let template = await renderAstroComponent(Component);
  return template;
}

// Filter out duplicate elements in our set
const uniqueElements = (item: any, index: number, all: any[]) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};

// Renders a page to completion by first calling the factory callback, waiting for its result, and then appending
// styles and scripts into the head.
export async function renderPage(result: SSRResult, Component: AstroComponentFactory, props: any, children: any) {
  const template = await renderToString(result, Component, props, children);
  const styles = Array.from(result.styles)
    .filter(uniqueElements)
    .map((style) => renderElement('style', style));
  const scripts = Array.from(result.scripts)
    .filter(uniqueElements)
    .map((script) => renderElement('script', script));
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

function renderElement(name: string, { props: _props, children = '' }: SSRElement) {
  // Do not print `hoist`, `lang`, `global`
  const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
  if (defineVars) {
    if (name === 'style') {
      if (props.global) {
        children = defineStyleVars(`:root`, defineVars) + '\n' + children;
      } else {
        children = defineStyleVars(`.astro-${astroId}`, defineVars) + '\n' + children;
      }
      delete props.global;
    }
    if (name === 'script') {
      delete props.hoist;
      children = defineScriptVars(defineVars) + '\n' + children;
    }
  }
  return `<${name}${spreadAttributes(props)}>${children}</${name}>`;
}
