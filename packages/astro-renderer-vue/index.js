export default {
  jsx: {
    importSource: 'vue',
    factory: 'h',
  },

  server: {
    dependencies: ['vue', '@vue/server-renderer'],
    renderToStaticMarkup({ ['vue']: { defineComponent, createSSRApp }, ['@vue/server-renderer']: { renderToString } }) {
      return async (Component, props, children) => {
        const App = defineComponent({
          components: { Component },
          data: () => ({ props }),
          template: `<Component v-bind="props">${children.join('\n')}</Component>`,
        });
        const app = createSSRApp(App);
        const html = await renderToString(app);
        return { html };
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
