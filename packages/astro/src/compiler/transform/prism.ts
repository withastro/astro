import type { Transformer } from '../../@types/transformer';
import type { Script, TemplateNode } from '@astrojs/parser';
import { getAttrValue } from '../../ast.js';

export const PRISM_IMPORT = `import Prism from 'astro/components/Prism.astro';`;
const prismImportExp = /import Prism from ['"]astro\/components\/Prism.astro['"]/;

/** escaping code samples that contain template string replacement parts, ${foo} or example. */
function escape(code: string) {
  return code
    .replace(/[`$]/g, (match) => {
      return '\\' + match;
    })
    .replace(/ASTRO_ESCAPED_LEFT_CURLY_BRACKET\0/g, '{');
}

/** Unescape { characters transformed by Markdown generation */
function unescapeCode(code: TemplateNode) {
  code.children = code.children?.map((child) => {
    if (child.type === 'Text') {
      return { ...child, raw: child.raw.replace(/ASTRO_ESCAPED_LEFT_CURLY_BRACKET\0/g, '{') };
    }
    return child;
  });
}

/** default export - Transform prism   */
export default function (module: Script): Transformer {
  let usesPrism = false;

  return {
    visitors: {
      html: {
        Element: {
          enter(node) {
            if (node.name === 'code') {
              unescapeCode(node);
              return;
            }

            if (node.name !== 'pre') return;
            const codeEl = node.children && node.children[0];
            if (!codeEl || codeEl.name !== 'code') return;

            const className = getAttrValue(codeEl.attributes, 'class') || '';
            const classes = className.split(' ');

            let lang: string | undefined;
            for (let cn of classes) {
              const matches = /language-(.+)/.exec(cn);
              if (matches) {
                lang = matches[1];
                break;
              }
            }

            if (!lang) return;
            let classesWithoutLang = classes.filter((cn) => cn !== `language-${lang}`);

            let codeData = codeEl.children && codeEl.children[0];
            if (!codeData) return;
            let code = codeData.data as string;

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
                  name: 'class',
                  value: [
                    {
                      type: 'Text',
                      raw: classesWithoutLang.join(' '),
                      data: classesWithoutLang.join(' '),
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
                        codeChunks: ['`' + escape(code) + '`'],
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
      if (usesPrism && module && !prismImportExp.test(module.content)) {
        module.content = PRISM_IMPORT + '\n' + module.content;
      }
    },
  };
}
