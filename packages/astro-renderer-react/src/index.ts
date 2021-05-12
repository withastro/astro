import type { AstroRenderer } from 'astro/renderer';
import type { ComponentType } from 'react';

interface ReactDependencies {
  shared: {
    react: typeof import('react')
  },
  server: {
    ['react-dom/server']: typeof import('react-dom/server')
  },
  client: {}
}

const renderer: AstroRenderer<ReactDependencies, ComponentType> = {
  jsx: {
    importSource: 'react',
    factory: 'createElement',
    fragmentFactory: 'Fragment',
    transformChildren: true,
  },

  server: {
    dependencies: ['react', 'react-dom/server'],
    renderToStaticMarkup({ react, ['react-dom/server']: reactDOMServer }) {
      const { createElement } = react;
      const { renderToStaticMarkup } = reactDOMServer;
      return async (Component, props, children) => {
        const code = renderToStaticMarkup(createElement(Component, props, children));

        return { 
          '.html': { code }
        };
      };
    },
  },

  client: {
    dependencies: ['react'],
    hydrateStaticMarkup({ react }, el) {
      return (Component, props, children) => `
        const {h,hydrate} = ${react};
        hydrate(h(${Component},${props},${children}),${el})
      `;
    },
  },
};

export default renderer;
