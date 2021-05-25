import { renderToString } from '@vue/server-renderer';
import { h, createSSRApp } from 'vue';
import StaticHtml from './static-html';

export default {
  name: '@astro-renderer/vue',
  snowpackPlugin: '@snowpack/plugin-vue',
  check: (Component) => Component['ssrRender'],
  renderToStaticMarkup: async (Component, props, children) => {
    const app = createSSRApp({ render: () => h(Component, props, { default: () => h(StaticHtml, { value: children }) })});
    const html = await renderToString(app);
    return { html };
  }
};
