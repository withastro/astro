import { h, render } from 'preact';
import { renderToString } from 'preact-render-to-string';
import type { ComponentRenderer } from '../../@types/renderer';
import { createRenderer } from './renderer';

// This prevents tree-shaking of render.
Function.prototype(render);

const Preact: ComponentRenderer = {
  renderStatic(Component) {
    return async (props, ...children) => renderToString(h(Component, props, ...children));
  },
  imports: {
    preact: ['render', 'h'],
  },
  render({ Component, root, props }) {
    return `render(h(${Component}, ${props}), ${root})`;
  },
};

const renderer = createRenderer(Preact);

export const __preact_static = renderer.static;
export const __preact_load = renderer.load;
export const __preact_idle = renderer.idle;
export const __preact_visible = renderer.visible;
