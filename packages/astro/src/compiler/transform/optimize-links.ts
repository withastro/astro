import type { Transformer, TransformOptions } from '../../@types/transformer';
import { getAttrValue } from '../../ast.js';

/** Transform <!doctype> tg */
export default function (_opts: TransformOptions): Transformer {
  return {
    visitors: {
      html: {
        Element: {
          leave(node) {
            let name = node.name;
            if (name !== 'body') {
              return;
            }
            if (node.children?.find(el => el.name === 'script' && el.data.linkOptim)) return;

            const prefetchScript = {
              start: 0,
              end: 0,
              type: 'Element',
              name: 'script',
              data: {
                linkOptim: true
              },
              attributes: [
                {
                  type: 'Attribute',
                  name: 'type',
                  value: [
                    {
                      type: 'Text',
                      raw: 'module',
                      data: 'module',
                    },
                  ],
                },
                {
                  type: 'Attribute',
                  name: 'src',
                  value: [
                    {
                      type: 'Text',
                      raw: '/_astro_internal/runtime/prefetch.js',
                      data: '/_astro_internal/runtime/prefetch.js',
                    },
                  ],
                },
              ],
              children: [],
            };
            
            const newBody = { ...node, children: [...(node.children ?? []), prefetchScript] };
            this.replace(newBody);
          }
        },
      },
    },
    async finalize() {},
  };
}
