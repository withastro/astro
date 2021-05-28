import hash from 'shorthash';
import { valueToEstree, Value } from 'estree-util-value-to-estree';
import { generate } from 'astring';
import * as astro from './renderer-astro';

// A more robust version alternative to `JSON.stringify` that can handle most values
// see https://github.com/remcohaszing/estree-util-value-to-estree#readme
const serialize = (value: Value) => generate(valueToEstree(value));

/**
 * These values are dynamically injected by Snowpack.
 * See comment in `snowpack-plugin.cjs`!
 *
 * In a world where Snowpack supports virtual files, this won't be necessary.
 * It would ideally look something like:
 *
 * ```ts
 * import { __rendererSources, __renderers } from "virtual:astro/runtime"
 * ```
 */
declare let __rendererSources: string[];
declare let __renderers: any[];

__rendererSources = ['', ...__rendererSources];
__renderers = [astro, ...__renderers];

const rendererCache = new WeakMap();

/** For a given component, resolve the renderer. Results are cached if this instance is encountered again */
async function resolveRenderer(Component: any, props: any = {}, children?: string) {
  if (rendererCache.has(Component)) {
    return rendererCache.get(Component);
  }

  for (const __renderer of __renderers) {
    // Yes, we do want to `await` inside of this loop!
    // __renderer.check can't be run in parallel, it
    // returns the first match and skips any subsequent checks
    const shouldUse = await __renderer.check(Component, props, children);
    if (shouldUse) {
      rendererCache.set(Component, __renderer);
      return __renderer;
    }
  }
}

interface AstroComponentProps {
  displayName: string;
  hydrate?: 'load' | 'idle' | 'visible';
  componentUrl?: string;
  componentExport?: { value: string; namespace?: boolean };
}

/** For hydrated components, generate a <script type="module"> to load the component */
async function generateHydrateScript({ renderer, astroId, props }: any, { hydrate, componentUrl, componentExport }: Required<AstroComponentProps>) {
  const rendererSource = __rendererSources[__renderers.findIndex((r) => r === renderer)];

  const script = `<script type="module">
import setup from '/_astro_internal/hydrate/${hydrate}.js';
setup("${astroId}", async () => {
  const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${componentUrl}"), import("${rendererSource}")]);
  return (el, children) => hydrate(el)(Component, ${serialize(props)}, children);
});
</script>`;

  return script;
}

export const __astro_component = (Component: any, componentProps: AstroComponentProps = {} as any) => {
  if (Component == null) {
    throw new Error(`Unable to render <${componentProps.displayName}> because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`);
  }

  return async (props: any, ..._children: string[]) => {
    const children = _children.join('\n');
    let renderer = await resolveRenderer(Component, props, children);

    if (!renderer) {
      // If the user only specifies a single renderer, but the check failed
      // for some reason... just default to their preferred renderer.
      renderer = (__rendererSources.length === 2) ? __renderers[1] : null;

      if (!renderer) {
        const name = typeof Component === 'function' ? Component.displayName ?? Component.name : `{ ${Object.keys(Component).join(', ')} }`;
        throw new Error(`No renderer found for ${name}! Did you forget to add a renderer to your Astro config?`);
      }
    }
    const { html } = await renderer.renderToStaticMarkup(Component, props, children);
    // If we're NOT hydrating this component, just return the HTML
    if (!componentProps.hydrate) {
      // It's safe to remove <astro-fragment>, static content doesn't need the wrapper
      return html.replace(/\<\/?astro-fragment\>/g, '');
    }

    // If we ARE hydrating this component, let's generate the hydration script
    const astroId = hash.unique(html);
    const script = await generateHydrateScript({ renderer, astroId, props }, componentProps as Required<AstroComponentProps>);
    const astroRoot = `<astro-root uid="${astroId}">${html}</astro-root>`;
    return [astroRoot, script].join('\n');
  };
};
