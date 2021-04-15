import type { ComponentRenderer } from '../../@types/renderer';
import type { SvelteComponent } from 'svelte';
import { createRenderer } from './renderer';
import SvelteWrapper from '../SvelteWrapper.svelte.server';

const SvelteRenderer: ComponentRenderer<SvelteComponent> = {
  renderStatic(Component) {
    return async (props, ...children) => {
      const { html } = SvelteWrapper.render({ __astro_component: Component, __astro_children: children.join('\n'), ...props });
      return html;
    };
  },
  imports: {
    'astro/frontend/runtime/svelte': ['default: render'],
  },
  render({ Component, root, props, childrenAsString }) {
    return `render(${root}, ${Component}, ${props}, ${childrenAsString});`;
  },
};

const renderer = createRenderer(SvelteRenderer);

export const __svelte_static = renderer.static;
export const __svelte_load = renderer.load;
export const __svelte_idle = renderer.idle;
export const __svelte_visible = renderer.visible;
