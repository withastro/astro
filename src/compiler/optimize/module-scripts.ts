import type { Optimizer } from '../../@types/optimizer';
import type { CompileOptions } from '../../@types/compiler';

import path from 'path';
import { getAttrValue, setAttrValue } from '../../ast.js';

export default function ({ compileOptions, filename }: { compileOptions: CompileOptions; filename: string; fileID: string }): Optimizer {
  const { astroConfig } = compileOptions;
  const { astroRoot } = astroConfig;
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
            const fromAstroRoot = path.posix.relative(astroRoot.pathname, srcUrl.pathname);
            const absoluteUrl = `/_astro/${fromAstroRoot}`;
            setAttrValue(node.attributes, 'src', absoluteUrl);
          },
        },
      },
    },
    async finalize() {},
  };
}
