import type { DynamicRenderContext, DynamicRendererGenerator, SupportedComponentRenderer, StaticRendererGenerator } from '../../@types/renderer';

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
  const serializeProps = (props: Record<string, any>) => JSON.stringify(props);
  const createContext = () => {
    const astroId = `${Math.floor(Math.random() * 1e16)}`;
    return { ['data-astro-id']: astroId, root: `document.querySelector('[data-astro-id="${astroId}"]')`, Component: 'Component' };
  };
  const createDynamicRender: DynamicRendererGenerator = (wrapperStart, wrapperEnd) => (Component, renderContext) => {
    const innerContext = createContext();
    return async (props, ...children) => {
      let value: string;
      try {
        value = await _static(Component)(props, ...children);
      } catch (e) {
        value = '';
      }
      value = `<div data-astro-id="${innerContext['data-astro-id']}">${value}</div>`;

      return `${value}\n<script type="module">${typeof wrapperStart === 'function' ? wrapperStart(innerContext) : wrapperStart}\n${_imports(renderContext)}\n${renderer.render({
        ...innerContext,
        props: serializeProps(props),
      })}\n${typeof wrapperEnd === 'function' ? wrapperEnd(innerContext) : wrapperEnd}</script>`;
    };
  };

  return {
    static: _static,
    load: createDynamicRender('(async () => {', '})()'),
    idle: createDynamicRender('requestIdleCallback(async () => {', '})'),
    visible: createDynamicRender(
      'const o = new IntersectionObserver(async ([entry]) => { if (!entry.isIntersecting) { return; } o.disconnect();',
      ({ root }) => `}); o.observe(${root})`
    ),
  };
}
