import { h, createSSRApp } from 'vue';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) => {
  delete props['class'];
  // Expose name on host component for Vue devtools
  const name = Component.name ? `${Component.name} Host` : undefined;
  const slots = {};
  if (children != null) {
    slots.default = () => h(StaticHtml, { value: children });
  }
  const app = createSSRApp({ name, render: () => h(Component, props, slots) });
  app.mount(element, true);
};
