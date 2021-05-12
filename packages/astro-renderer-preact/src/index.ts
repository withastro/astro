import type { AstroRenderer } from 'astro/renderer';
import type { ComponentType } from 'preact';

interface PreactDependencies {
  shared: {
    ['preact']: typeof import('preact')
  }
  server: {
    ['preact-render-to-string']: typeof import('preact-render-to-string')
  },
  client: {}
}

const renderer: AstroRenderer<PreactDependencies, ComponentType> = {
  jsx: {
    importSource: 'preact',
    factory: 'h',
    fragmentFactory: 'Fragment',
    transformChildren: false,
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
