import type { Transformer } from '../../@types/transformer';
import type { CompileOptions } from '../../@types/compiler';

import { getAttrValue, setAttrValue } from '../../ast.js';

/** Transform <script type="module"> */
export default function ({ compileOptions, filename }: { compileOptions: CompileOptions; filename: string; fileID: string }): Transformer {
  const { astroConfig } = compileOptions;
  const fileUrl = new URL(`file://${filename}`);

  return {
    visitors: {
      html: {
        Element: {
          enter(node) {
            let name = node.name;
            if (name !== 'script') {
              return;
            }

            let type = getAttrValue(node.attributes, 'type');
            if (type !== 'module') {
              return;
            }

            let src = getAttrValue(node.attributes, 'src');
            if (!src || !src.startsWith('.')) {
              return;
            }

            const srcUrl = new URL(src, fileUrl);
            const absoluteUrl = `/_astro/${srcUrl.href.replace(astroConfig.projectRoot.href, '')}`;
            setAttrValue(node.attributes, 'src', absoluteUrl);
          },
        },
      },
    },
    async finalize() {},
  };
}
