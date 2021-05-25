import { Transformer } from '../../@types/transformer';
import type { TemplateNode } from 'astro-parser';

/** If there are hydrated components, inject styles for [data-astro-root] and [data-astro-children] */
export default function (): Transformer {
  let head: TemplateNode;
  let body: TemplateNode;
  let hasComponents = false;

  return {
    visitors: {
      html: {
        InlineComponent: {
          enter(node, parent) {
            const [name, kind] = node.name.split(':');
            if (kind && !hasComponents) {
              hasComponents = true;
            }
          }
        },
        Element: {
          enter(node) {
            if (!hasComponents) return;
            switch (node.name) {
              case 'head': {
                head = node;
                return;
              }
              case 'body': {
                body = node;
                return;
              }
              default: return;
            }
          }
        }
      },
    },
    async finalize() {
      if (!(head && hasComponents)) return;

      const style: TemplateNode = {
        type: 'Element',
        name: 'style',
        attributes: [
          { name: 'type', type: 'Attribute', value: [{ type: 'Text', raw: 'text/css', data: 'text/css' }] },
        ],  
        start: 0,
        end: 0,
        children: [
          {
            start: 0,
            end: 0,
            type: 'Text',
            data: 'astro-root, astro-fragment { display: contents; }',
            raw: 'astro-root, astro-fragment { display: contents; }'
          }
        ]
      };
      head.children = [...(head.children ?? []), style];
    },
  };
}
