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

            // scenario 1: if missing "src", ignore
            if (!src) {
              return;
            }

            // scenario 2: if absolute path, ignore
            if (src.startsWith('/')) {
              return;
            }

            // scenario 3: if remote URL, ignore
            try {
              new URL(src); // if this succeeds, this is a complete, valid URL
              return;
            } catch (err) {
              // do nothing
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
