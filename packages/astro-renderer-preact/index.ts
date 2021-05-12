import type { AstroRenderer, DependencyMaps } from 'astro/renderer';

interface PreactDependencies extends DependencyMaps {
  shared: {
    preact: typeof import('preact')
  }
  server: {
    ['preact-render-to-string']: typeof import('preact-render-to-string')
  }
}

const renderer: AstroRenderer<PreactDependencies> = {
  jsx: {
    importSource: 'preact',
    factory: 'h',
    fragmentFactory: 'Fragment',
    transformChildren: true,
  },

  server: {
    dependencies: ['preact', 'preact-render-to-string'],
    renderToStaticMarkup({ preact, ['preact-render-to-string']: preactRenderToString }) {
      const { h } = preact;
      const { renderToString } = preactRenderToString;
      return async (Component, props, children) => {
        const code = renderToString(h(Component, props, children));

        return { 
          '.html': { code }
        };
      };
    },
  },

  client: {
    dependencies: ['preact'],
    hydrateStaticMarkup({ preact }, el) {
      return (Component, props, children) => `
        const {h,hydrate} = ${preact};
        hydrate(h(${Component},${props},${children}),${el})
      `;
    },
  },
};

export default renderer;
