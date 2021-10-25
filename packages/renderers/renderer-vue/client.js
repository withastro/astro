import { h, createSSRApp } from 'vue';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) => {
  delete props['class'];
  // Expose name on host component for Vue devtools
  const name = Component.name ? `${Component.name} Host` : undefined;
  const app = createSSRApp({ name, render: () => h(Component, props, { default: () => h(StaticHtml, { value: children }) }) });
  app.mount(element, true);
};
