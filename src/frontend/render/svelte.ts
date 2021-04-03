import type { ComponentRenderer } from '../../@types/renderer';
import { createRenderer } from './renderer';

const SvelteRenderer: ComponentRenderer = {
  renderStatic(Component) {
    return async (props, ...children) => {
      const { html } = Component.render(props);
      return html;
    };
  },
  render({ Component, root, props }) {
    return `new ${Component}({
      target: ${root},
      props: ${props}
    })`;
  },
};

const renderer = createRenderer(SvelteRenderer);

export const __svelte_static = renderer.static;
export const __svelte_load = renderer.load;
export const __svelte_idle = renderer.idle;
export const __svelte_visible = renderer.visible;
