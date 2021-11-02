import type { AstroComponentMetadata } from '../../@types/astro-core';
import type { SSRElement } from '../../@types/astro-runtime';
import { valueToEstree } from 'estree-util-value-to-estree';
import * as astring from 'astring';
import { serializeListValue } from './util.js';

const { generate, GENERATOR } = astring;

// INVESTIGATE: What features are we getting from this that we need?
// JSON.stringify has a "replacer" argument.
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

// Serializes props passed into a component so that they can be reused during hydration.
// The value is any
export function serializeProps(value: any) {
  return generate(valueToEstree(value), {
    generator: customGenerator,
  });
}

interface ExtractedProps {
  hydration: {
    directive: string;
    value: string;
    componentUrl: string;
    componentExport: { value: string };
  } | null;
  props: Record<string | number, any>;
}

// Used to extract the directives, aka `client:load` information about a component.
// Finds these special props and removes them from what gets passed into the component.
export function extractDirectives(inputProps: Record<string | number, any>): ExtractedProps {
  let extracted: ExtractedProps = {
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
    } else if (key === 'class:list') {
      // support "class" from an expression passed into a component (#782)
      extracted.props[key.slice(0, -5)] = serializeListValue(value);
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}

interface HydrateScriptOptions {
  renderer: any;
  astroId: string;
  props: Record<string | number, any>;
}

/** For hydrated components, generate a <script type="module"> to load the component */
export async function generateHydrateScript(scriptOptions: HydrateScriptOptions, metadata: Required<AstroComponentMetadata>): Promise<SSRElement> {
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
  return (el, children) => hydrate(el)(Component, ${serializeProps(props)}, children);
`
    : `await import("${componentUrl}");
  return () => {};
`;

  const hydrationScript = {
    props: { type: 'module' },
    children: `import setup from 'astro/client/${hydrate}.js';
setup("${astroId}", {${metadata.hydrateArgs ? `value: ${JSON.stringify(metadata.hydrateArgs)}` : ''}}, async () => {
  ${hydrationSource}
});
`,
  };

  return hydrationScript;
}
