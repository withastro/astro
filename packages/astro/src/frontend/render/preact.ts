import { h, render, ComponentType } from 'preact';
import { renderToString } from 'preact-render-to-string';
import { childrenToVnodes } from './utils';
import type { ComponentRenderer } from '../../@types/renderer';
import { createRenderer } from './renderer';

// This prevents tree-shaking of render.
Function.prototype(render);

const Preact: ComponentRenderer<ComponentType> = {
  jsxPragma: h,
  jsxPragmaName: 'h',
  renderStatic(Component) {
    return async (props, ...children) => {
      return renderToString(h(Component, props, childrenToVnodes(h, children)));
    };
  },
  imports: {
    preact: ['render', 'Fragment', 'h'],
  },
  render({ Component, root, props, children }) {
    return `render(h(${Component}, ${props}, h(Fragment, null, ...${children})), ${root})`;
  },
};

const renderer = createRenderer(Preact);

export const __preact_static = renderer.static;
export const __preact_load = renderer.load;
export const __preact_idle = renderer.idle;
export const __preact_visible = renderer.visible;
