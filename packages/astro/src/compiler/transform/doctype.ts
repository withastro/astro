import { Transformer } from '../../@types/transformer';

/** Transform <!doctype> tg */
export default function (_opts: { filename: string; fileID: string }): Transformer {
  let hasDoctype = false;

  return {
    visitors: {
      html: {
        Element: {
          enter(node, parent, _key, index) {
            if (node.name === '!doctype') {
              hasDoctype = true;
            }
            if (node.name === 'html' && !hasDoctype) {
              const dtNode = {
                start: 0,
                end: 0,
                attributes: [{ type: 'Attribute', name: 'html', value: true, start: 0, end: 0 }],
                children: [],
                name: '!doctype',
                type: 'Element',
              };
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              parent.children!.splice(index, 0, dtNode);
              hasDoctype = true;
            }
          },
        },
      },
    },
    async finalize() {
      // Nothing happening here.
    },
  };
}
