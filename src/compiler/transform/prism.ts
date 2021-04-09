import type { Transformer } from '../../@types/transformer';
import type { Script } from '../../parser/interfaces';
import { getAttrValue } from '../../ast.js';

const PRISM_IMPORT = `import Prism from 'astro/components/Prism.astro';\n`;
const prismImportExp = /import Prism from ['"]astro\/components\/Prism.astro['"]/;

function escape(code: string) {
  return code.replace(/[`$]/g, (match) => {
    return '\\' + match;
  });
}

export default function (module: Script): Transformer {
  let usesPrism = false;

  return {
    visitors: {
      html: {
        Element: {
          enter(node) {
            if (node.name !== 'code') return;
            const className = getAttrValue(node.attributes, 'class') || '';
            const classes = className.split(' ');

            let lang;
            for (let cn of classes) {
              const matches = /language-(.+)/.exec(cn);
              if (matches) {
                lang = matches[1];
              }
            }

            if (!lang) return;

            let code;
            if (node.children?.length) {
              code = node.children[0].data;
            }

            const repl = {
              start: 0,
              end: 0,
              type: 'InlineComponent',
              name: 'Prism',
              attributes: [
                {
                  type: 'Attribute',
                  name: 'lang',
                  value: [
                    {
                      type: 'Text',
                      raw: lang,
                      data: lang,
                    },
                  ],
                },
                {
                  type: 'Attribute',
                  name: 'code',
                  value: [
                    {
                      type: 'MustacheTag',
                      expression: {
                        type: 'Expression',
                        codeStart: '`' + escape(code) + '`',
                        codeEnd: '',
                        children: [],
                      },
                    },
                  ],
                },
              ],
              children: [],
            };

            this.replace(repl);
            usesPrism = true;
          },
        },
      },
    },
    async finalize() {
      // Add the Prism import if needed.
      if (usesPrism && !prismImportExp.test(module.content)) {
        module.content = PRISM_IMPORT + module.content;
      }
    },
  };
}
