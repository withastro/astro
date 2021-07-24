import type { Renderer, AstroComponentMetadata } from '../@types/astro';
import hash from 'shorthash';
import { valueToEstree, Value } from 'estree-util-value-to-estree';
import { generate } from 'astring';
import * as astroHtml from './renderer-html';

// A more robust version alternative to `JSON.stringify` that can handle most values
// see https://github.com/remcohaszing/estree-util-value-to-estree#readme
const serialize = (value: Value) => generate(valueToEstree(value));

export interface RendererInstance {
  source: string | null;
  renderer: Renderer;
  polyfills: string[];
  hydrationPolyfills: string[];
}

const astroHtmlRendererInstance: RendererInstance = {
  source: '',
  renderer: astroHtml as Renderer,
  polyfills: [],
  hydrationPolyfills: [],
};

let rendererInstances: RendererInstance[] = [];

export function setRenderers(_rendererInstances: RendererInstance[]) {
  rendererInstances = ([] as RendererInstance[]).concat(_rendererInstances);
}

function isCustomElementTag(name: string | Function) {
  return typeof name === 'string' && /-/.test(name);
}

const rendererCache = new Map<any, RendererInstance>();

/** For a given component, resolve the renderer. Results are cached if this instance is encountered again */
async function resolveRenderer(Component: any, props: any = {}, children?: string): Promise<RendererInstance | undefined> {
  if (rendererCache.has(Component)) {
    return rendererCache.get(Component)!;
  }

  const errors: Error[] = [];
  for (const instance of rendererInstances) {
    const { renderer } = instance;

    // Yes, we do want to `await` inside of this loop!
    // __renderer.check can't be run in parallel, it
    // returns the first match and skips any subsequent checks
    try {
      const shouldUse: boolean = await renderer.check(Component, props, children);

      if (shouldUse) {
        rendererCache.set(Component, instance);
        return instance;
      }
    } catch (err) {
      errors.push(err);
    }
  }

  if (errors.length) {
    // For now just throw the first error we encounter.
    throw errors[0];
  }
}

interface HydrateScriptOptions {
  instance: RendererInstance;
  astroId: string;
  props: any;
}

/** For hydrated components, generate a <script type="module"> to load the component */
async function generateHydrateScript(scriptOptions: HydrateScriptOptions, metadata: Required<AstroComponentMetadata>) {
  const { instance, astroId, props } = scriptOptions;
  const { source } = instance;
  const { hydrate, componentUrl, componentExport } = metadata;

  let hydrationSource = '';
  if (instance.hydrationPolyfills.length) {
    hydrationSource += `await Promise.all([${instance.hydrationPolyfills.map((src) => `import("${src}")`).join(', ')}]);\n`;
  }

  hydrationSource += source
    ? `
  const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${componentUrl}"), import("${source}")]);
  return (el, children) => hydrate(el)(Component, ${serialize(props)}, children);
`
    : `
  await import("${componentUrl}");
  return () => {};
`;

  const hydrationScript = `<script type="module">
import setup from '/_astro_frontend/hydrate/${hydrate}.js';
setup("${astroId}", {${metadata.value ? `value: "${metadata.value}"` : ''}}, async () => {
  ${hydrationSource}
});
</script>`;

  return hydrationScript;
}

const getComponentName = (Component: any, componentProps: any) => {
  if (componentProps.displayName) return componentProps.displayName;
  switch (typeof Component) {
    case 'function':
      return Component.displayName ?? Component.name;
    case 'string':
      return Component;
    default: {
      return Component;
    }
  }
};

const prepareSlottedChildren = (children: string | Record<any, any>[]) => {
  const $slots: Record<string, string> = {
    default: '',
  };
  for (const child of children) {
    if (typeof child === 'string') {
      $slots.default += child;
    } else if (typeof child === 'object' && child['$slot']) {
      if (!$slots[child['$slot']]) $slots[child['$slot']] = '';
      $slots[child['$slot']] += child.children.join('').replace(new RegExp(`slot="${child['$slot']}"\s*`, ''));
    }
  }

  return { $slots };
};

const removeSlottedChildren = (_children: string | Record<any, any>[]) => {
  let children = '';
  for (const child of _children) {
    if (typeof child === 'string') {
      children += child;
    } else if (typeof child === 'object' && child['$slot']) {
      children += child.children.join('');
    }
  }

  return children;
};

/** The main wrapper for any components in Astro files */
export function __astro_component(Component: any, metadata: AstroComponentMetadata = {} as any) {
  if (Component == null) {
    throw new Error(`Unable to render ${metadata.displayName} because it is ${Component}!\nDid you forget to import the component or is it possible there is a typo?`);
  } else if (typeof Component === 'string' && !isCustomElementTag(Component)) {
    throw new Error(`Astro is unable to render ${metadata.displayName}!\nIs there a renderer to handle this type of component defined in your Astro config?`);
  }

  return async function __astro_component_internal(props: any, ..._children: any[]) {
    if (Component.isAstroComponent) {
      return Component.__render(props, prepareSlottedChildren(_children));
    }
    const children = removeSlottedChildren(_children);
    let instance = await resolveRenderer(Component, props, children);

    if (!instance) {
      if (isCustomElementTag(Component)) {
        instance = astroHtmlRendererInstance;
      } else {
        // If the user only specifies a single renderer, but the check failed
        // for some reason... just default to their preferred renderer.
        instance = rendererInstances.length === 2 ? rendererInstances[1] : undefined;
      }

      if (!instance) {
        const name = getComponentName(Component, metadata);
        throw new Error(`No renderer found for ${name}! Did you forget to add a renderer to your Astro config?`);
      }
    }
    let { html } = await instance.renderer.renderToStaticMarkup(Component, props, children, metadata);

    if (instance.polyfills.length) {
      let polyfillScripts = instance.polyfills.map((src) => `<script type="module" src="${src}"></script>`).join('');
      html = html + polyfillScripts;
    }

    // If we're NOT hydrating this component, just return the HTML
    if (!metadata.hydrate) {
      // It's safe to remove <astro-fragment>, static content doesn't need the wrapper
      return html.replace(/\<\/?astro-fragment\>/g, '');
    }

    // If we ARE hydrating this component, let's generate the hydration script
    const stringifiedProps = JSON.stringify(props);
    const astroId = hash.unique(html + stringifiedProps);
    const script = await generateHydrateScript({ instance, astroId, props }, metadata as Required<AstroComponentMetadata>);
    const astroRoot = `<astro-root uid="${astroId}">${html}</astro-root>`;
    return [astroRoot, script].join('\n');
  };
}
