import { h, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import StaticHtml from './static-html.js';

function check(Component) {
  return !!Component['ssrRender'];
}

async function renderToStaticMarkup(Component, props, children) {
  const slots = {};
  if (children != null) {
    slots.default = () => h(StaticHtml, { value: children });
  }
  const app = createSSRApp({ render: () => h(Component, props, slots) });
  const html = await renderToString(app);
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};
