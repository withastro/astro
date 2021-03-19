import type { Ast, TemplateNode } from '../compiler/interfaces';
import type { Optimizer } from './types';
import { transformStyle } from '../style.js';

export default function ({ filename, fileID }: { filename: string; fileID: string }): Optimizer {
  const classNames: Set<string> = new Set();
  let stylesPromises: any[] = [];

  return {
    visitors: {
      html: {
        Element: {
          enter(node) {
            for (let attr of node.attributes) {
              if (attr.name === 'class') {
                for (let value of attr.value) {
                  if (value.type === 'Text') {
                    const classes = value.data.split(' ');
                    for (const className in classes) {
                      classNames.add(className);
                    }
                  }
                }
              }
            }
          },
        },
      },
      css: {
        Style: {
          enter(node: TemplateNode) {
            const code = node.content.styles;
            const typeAttr = node.attributes && node.attributes.find(({ name }: { name: string }) => name === 'type');
            stylesPromises.push(
              transformStyle(code, {
                type: (typeAttr.value[0] && typeAttr.value[0].raw) || undefined,
                classNames,
                filename,
                fileID,
              })
            ); // TODO: styles needs to go in <head>
          },
        },
      },
    },
    async finalize() {
      const styles = await Promise.all(stylesPromises); // TODO: clean this up
      // console.log({ styles });
    },
  };
}
