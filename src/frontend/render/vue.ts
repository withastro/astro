import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h as createElement } from 'vue';
import { Renderer, createRenderer } from './renderer';

const Vue: Renderer = {
  renderStatic(Component) {
    return (props, ...children) => {
      const app = createSSRApp({
        components: {
          Component,
        },
        render() {
          return createElement(Component as any, props);
        },
      });
      // Uh oh, Vue's `renderToString` is async... Does that mean everything needs to be?
      return renderToString(app) as any;
    };
  },
  imports: {
    vue: ['createApp', 'h as createElement'],
  },
  render({ Component, root, props }) {
    return `const App = { render() { return createElement(${Component}, ${props} )} };
createApp(App).mount(${root})`;
  },
};

const renderer = createRenderer(Vue);

export const __vue_static = renderer.static;
export const __vue_load = renderer.load;
export const __vue_idle = renderer.idle;
export const __vue_visible = renderer.visible;
