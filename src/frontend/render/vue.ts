import type { ComponentRenderer } from '../../@types/renderer';
import type { Component as VueComponent } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { defineComponent, createSSRApp, h as createElement } from 'vue';
import { createRenderer } from './renderer';

/**
 * Users might attempt to use :vueAttribute syntax to pass primitive values.
 * If so, try to JSON.parse them to get the primitives
 */
function cleanPropsForVue(obj: Record<string, any>) {
  let cleaned = {} as any;
  for (let [key, value] of Object.entries(obj)) {
    if (key.startsWith(':')) {
      key = key.slice(1);
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {}
      }
    }
    cleaned[key] = value;
  }
  return cleaned;
}

const Vue: ComponentRenderer<VueComponent> = {
  jsxPragma: createElement,
  jsxPragmaName: 'createElement',
  renderStatic(Component) {
    return async (props, ...children) => {
      const App = defineComponent({
        components: {
          Component,
        },
        data() {
          return { props };
        },
        template: `<Component v-bind="props">${children.join('\n')}</Component>`,
      });

      const app = createSSRApp(App);
      const html = await renderToString(app);
      return html;
    };
  },
  imports: {
    vue: ['createApp', 'h: createElement'],
  },
  render({ Component, root, props, children }) {
    const vueProps = cleanPropsForVue(JSON.parse(props));
    return `const App = { render: () => createElement(${Component}, ${JSON.stringify(vueProps)}, { default: () => ${children} }) };
createApp(App).mount(${root});`;
  },
};

const renderer = createRenderer(Vue);

export const __vue_static = renderer.static;
export const __vue_load = renderer.load;
export const __vue_idle = renderer.idle;
export const __vue_visible = renderer.visible;
