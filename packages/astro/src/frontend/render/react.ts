import type { ComponentRenderer } from '../../@types/renderer';
import React, { ComponentType } from 'react';
import ReactDOMServer from 'react-dom/server';
import { createRenderer } from './renderer';
import { childrenToVnodes } from './utils';

const ReactRenderer: ComponentRenderer<ComponentType> = {
  jsxPragma: React.createElement,
  jsxPragmaName: 'React.createElement',
  renderStatic(Component) {
    return async (props, ...children) => {
      return ReactDOMServer.renderToString(React.createElement(Component, props, childrenToVnodes(React.createElement, children)));
    };
  },
  imports: {
    react: ['default: React'],
    'react-dom': ['default: ReactDOM'],
  },
  render({ Component, root, children, props }) {
    return `ReactDOM.hydrate(React.createElement(${Component}, ${props}, React.createElement(React.Fragment, null, ...${children})), ${root})`;
  },
};

const renderer = createRenderer(ReactRenderer);

export const __react_static = renderer.static;
export const __react_load = renderer.load;
export const __react_idle = renderer.idle;
export const __react_visible = renderer.visible;
