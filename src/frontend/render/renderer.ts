import type { DynamicRenderContext, DynamicRendererGenerator, SupportedComponentRenderer, StaticRendererGenerator } from '../../@types/renderer';
import { childrenToH, injectAstroId } from './utils';
// @ts-ignore
import shorthash from 'shorthash';

/** Initialize Astro Component renderer for Static and Dynamic components */
export function createRenderer(renderer: SupportedComponentRenderer) {
  const _static: StaticRendererGenerator = (Component) => renderer.renderStatic(Component);
  const _imports = (context: DynamicRenderContext) => {
    const values = Object.values(renderer.imports ?? {})
      .reduce((acc, v) => {
        return [...acc, `{ ${v.join(', ')} }`];
      }, [])
      .join(', ');
    const libs = Object.keys(renderer.imports ?? {})
      .reduce((acc: string[], lib: string) => {
        return [...acc, `import("${context.frameworkUrls[lib as any]}")`];
      }, [])
      .join(',');
    return `const [{${context.componentExport}: Component}, ${values}] = await Promise.all([import("${context.componentUrl}")${renderer.imports ? ', ' + libs : ''}]);`;
  };
  const serializeProps = ({ children: _, ...props }: Record<string, any>) => JSON.stringify(props);
  const createContext = (toHash: string, i: number) => {
    const hash = shorthash.unique(toHash);
    const astroId = `astro-${hash}${(i === 0) ? '' : `-${i}`}`;
    return { ['data-astro-id']: astroId, root: `document.querySelectorAll('[data-astro-id="${astroId}"]')`, Component: 'Component' };
  };
  let ids = new Map();
  
  const createDynamicRender: DynamicRendererGenerator = (wrapperStart, wrapperEnd) => {
    return (Component, renderContext) => {
      ids.clear();
      return async (props, ...children) => {
        let value: string;
        try {
          value = await _static(Component)(props, ...children);
        } catch (e) {
          value = '';
        }
        const i = (ids.has(value) ? ids.get(value) : -1) + 1;
        ids.set(value, i);
        const innerContext = createContext(value, i);
        value = injectAstroId(value, innerContext['data-astro-id']);

        const script = `
        ${typeof wrapperStart === 'function' ? wrapperStart(innerContext) : wrapperStart}
        const { createHydrationRoot } = await import('/_astro_internal/dom.js');
        const $$root = createHydrationRoot(${innerContext.root});
        ${_imports(renderContext)}
        ${renderer.render({
          ...innerContext,
          root: '$$root',
          props: serializeProps(props),
          children: `[${childrenToH(renderer, children) ?? ''}]`,
          childrenAsString: `\`${children}\``,
        })}
        ${typeof wrapperEnd === 'function' ? wrapperEnd(innerContext) : wrapperEnd}
      `;

      return [value, `<script type="module">${script.trim()}</script>`].join('\n');
    };
  }
  }

  return {
    static: _static,
    load: createDynamicRender('(async () => {', '})()'),
    idle: createDynamicRender('requestIdleCallback(async () => {', '})'),
    visible: createDynamicRender(
      'const o = new IntersectionObserver(async ([entry]) => { if (!entry.isIntersecting) { return; } o.disconnect();',
      ({ root }) => `}); Array.from(${root}.item(0).children).forEach(child => o.observe(child))`
    ),
  };
}
