import type { AstroRenderer } from 'astro/renderer';
import type { Component as ComponentType } from 'vue';

interface VueDependencies {
  shared: {
    vue: typeof import('vue')
  },
  server: {
    ['@vue/server-renderer']: typeof import('@vue/server-renderer')
  },
  client: {}
}

const renderer: AstroRenderer<VueDependencies, ComponentType> = {
  snowpackPlugin: '@snowpack/plugin-vue',

  jsx: {
    importSource: 'vue',
    factory: 'h'
  },

  server: {
    dependencies: ['vue', '@vue/server-renderer'],
    renderToStaticMarkup({ vue, ['@vue/server-renderer']: vueServerRenderer }) {
      const { defineComponent, createSSRApp } = vue;
      const { renderToString } = vueServerRenderer;
      
      return async (Component, props, children) => {
        const App = defineComponent({
          components: { Component },
          data: () => ({ props }),
          template: `<Component v-bind="props">${children.join('\n')}</Component>`,
        });
        const app = createSSRApp(App);
        const code = await renderToString(app);

        return { 
          '.html': { code }
        };
      };
    },
  },

  client: {
    dependencies: ['vue'],
    hydrateStaticMarkup({ vue }, el) {
      return (Component, props, children) => `
        const {createApp,h} = ${vue};
        const app = {render:()=>h(${Component},${props},{default:()=>${children}})};
        createApp(app).mount(${el});
      `;
    },
  },
};

export default renderer;
