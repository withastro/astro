import type { ComponentRenderer } from '../../@types/renderer';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h as createElement } from 'vue';
import { createRenderer } from './renderer';

const Vue: ComponentRenderer = {
  renderStatic(Component) {
    return async (props, ...children) => {
      const app = createSSRApp({
        components: {
          Component,
        },
        render() {
          return createElement(Component as any, props);
        },
      });
      const html = await renderToString(app);
      return html;
    };
  },
  imports: {
    vue: ['createApp', 'h: createElement'],
  },
  render({ Component, root, props }) {
    return `const App = { render() { return createElement(${Component}, ${props} )} };
createApp(App).mount(${root});`;
  },
};

const renderer = createRenderer(Vue);

export const __vue_static = renderer.static;
export const __vue_load = renderer.load;
export const __vue_idle = renderer.idle;
export const __vue_visible = renderer.visible;
