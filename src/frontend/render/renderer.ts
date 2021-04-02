interface DynamicRenderContext {
  componentUrl: string;
  componentExport: string;
  frameworkUrls: string;
}

export interface Renderer {
  renderStatic(Component: any): (props: Record<string, any>, ...children: any[]) => Promise<string>;
  render(context: { root: string; Component: string; props: string; [key: string]: string }): string;
  imports?: Record<string, string[]>;
}

/** Initialize Astro Component renderer for Static and Dynamic components */
export function createRenderer(renderer: Renderer) {
  const _static: Renderer['renderStatic'] = (Component: any) => renderer.renderStatic(Component);
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
  const createDynamicRender = (
    wrapperStart: string | ((context: ReturnType<typeof createContext>) => string),
    wrapperEnd: string | ((context: ReturnType<typeof createContext>) => string)
  ) => (Component: any, renderContext: DynamicRenderContext) => {
    const innerContext = createContext();
    return async (props: Record<string, any>, ...children: any[]) => {
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
