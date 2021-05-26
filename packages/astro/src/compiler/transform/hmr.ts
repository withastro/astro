import type { Transformer, TransformOptions } from '../../@types/transformer';

/** Transform AST to inject Snowpack's HMR scripts */
export default function ({ compileOptions: { hmrPort } }: TransformOptions): Transformer {
  return {
    visitors: {
      html: {
        Element: {
          enter(node, parent, _key, index) {
            if (node.name !== 'head') return;
            node.children = [...(node.children ?? []), 
            {
              type: 'Element',
              name: 'script',
              attributes: [],
              children: [
                { type: 'Text', data: `window.HMR_WEBSOCKET_URL = 'ws://localhost:${hmrPort}'`, start: 0, end: 0 }
              ],
              start: 0,
              end: 0
            }, {
              type: 'Element',
              name: 'script',
              attributes: [
                { type: 'Attribute', name: 'type', value: 'module', start: 0, end: 0 },
                { type: 'Attribute', name: 'src', value: '/_snowpack/hmr-client.js', start: 0, end: 0 }
              ],
              children: [],
              start: 0,
              end: 0
            }]
          },
        },
      },
    },
    async finalize() {
      // Nothing happening here.
    },
  };
}
