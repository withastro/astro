import { renderToString } from '@vue/server-renderer';
import { h, createSSRApp } from 'vue';
import StaticHtml from './static-html.js';

function check(Component) {
  return Component['ssrRender'];
}

async function renderToStaticMarkup(Component, props, children) {
  const app = createSSRApp({ render: () => h(Component, props, { default: () => h(StaticHtml, { value: children }) }) });
  const html = await renderToString(app);
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};
