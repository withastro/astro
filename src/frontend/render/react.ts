import { Renderer, createRenderer } from './renderer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const ReactRenderer: Renderer = {
  renderStatic(Component) {
    return async (props, ...children) => ReactDOMServer.renderToString(React.createElement(Component, props, children));
  },
  imports: {
    react: ['default: React'],
    'react-dom': ['default: ReactDOM'],
  },
  render({ Component, root, props }) {
    return `ReactDOM.render(React.createElement(${Component}, ${props}), ${root})`;
  },
};

const renderer = createRenderer(ReactRenderer);

export const __react_static = renderer.static;
export const __react_load = renderer.load;
export const __react_idle = renderer.idle;
export const __react_visible = renderer.visible;
