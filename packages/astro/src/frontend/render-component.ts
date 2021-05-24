import hash from 'shorthash';
import astro from './renderer-astro';

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
__renderers = [{ default: astro }, ...__renderers].map(renderer => typeof renderer.default === 'function' ? renderer.default() : renderer.default);

const rendererCache = new WeakMap();

/** For a given component, resolve the renderer. Results are cached if this instance is encountered again */
function resolveRenderer(Component: any) {
  if (rendererCache.has(Component)) {
    return rendererCache.get(Component);
  }

  for (const __renderer of __renderers) {
    const shouldUse = __renderer.check(Component)
    if (shouldUse) {
      rendererCache.set(Component, __renderer);
      return __renderer;
    }
  }

  const name = typeof Component === 'function' ? (Component.displayName ?? Component.name) : `{ ${Object.keys(Component).join(', ')} }`;
  throw new Error(`No renderer found for ${name}! Did you forget to add a "renderer" to your Astro config?`);
}

interface AstroComponentProps {
  displayName: string;
  hydrate?: 'load'|'idle'|'visible'; 
  componentUrl?: string; 
  componentExport?: { value: string, namespace?: boolean };
}

const load = ['(async () => {', '})()'];
const idle = ['requestIdleCallback(async () => {', '})'];
const visible = [
  'const o = new IntersectionObserver(async ([entry]) => { if (!entry.isIntersecting) { return; } o.disconnect();',
  ({ roots }: { roots: string }) => `}); for (const root of ${roots}) { Array.from(root.children).forEach(child => o.observe(child)) }`
]
const hydrateMethods = { load, idle, visible };

/** For hydrated components, generate a <script type="module"> to load the component */
async function generateHydrateScript({ renderer, astroId, props }: any, { hydrate, componentUrl, componentExport }: Required<AstroComponentProps>) {
  const rendererSource = __rendererSources[__renderers.findIndex(r => r.name === renderer.name)];
  let [wrapperStart, wrapperEnd] = hydrateMethods[hydrate];
  let start = typeof wrapperStart === 'string' ? wrapperStart : wrapperStart({ roots: 'roots' });
  let end = typeof wrapperEnd === 'string' ? wrapperEnd : wrapperEnd({ roots: 'roots' });

  const script = `<script type="module" data-astro-hydrate="${astroId}">
const roots = document.querySelectorAll("[data-astro-root="${astroId}"]");
let innerHTML = null;
let children = roots[0].querySelector("[data-astro-children]");
if (children) innerHTML = children.innerHTML;

${start}
  const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${componentUrl}"), import("${rendererSource}")]);
  for (const root of roots) {
    hydrate(root)(Component, ${props}, innerHTML);
  }
${end}
</script>`;

  return script;
}


export const __astro_component = (Component: any, componentProps: AstroComponentProps = {} as any)  => {
  if (Component == null) {
    throw new Error(`Unable to render <${componentProps.displayName}> because it is "${Component}"!\nDid you forget to import the component or is it possible there is a typo?`);
  }
  const renderer = resolveRenderer(Component);

  return async (props: any, ..._children: string[]) => {
      const children = _children.join('\n');
      const { html } = await renderer.renderToStaticMarkup(Component, props, children);
      // If we're NOT hydrating this component, just return the HTML
      if (!componentProps.hydrate) return html;
      
      // If we ARE hydrating this component, let's generate the hydration script
      const astroId = hash.unique(html);
      const element = `<div data-astro-root="${astroId}">${html}</div>`;
      const script = await generateHydrateScript({ renderer, astroId, props: JSON.stringify(props) }, componentProps as Required<AstroComponentProps>)
      return [element, script].join('\n');
  }
}
