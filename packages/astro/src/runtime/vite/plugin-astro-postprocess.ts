import * as babel from '@babel/core';
import * as babelTraverse from '@babel/traverse';
import type * as t from '@babel/types';
import type { Plugin } from 'vite';
import type { AstroConfig } from '../../@types/astro.js';
import { AstroDevServer } from '../../dev/index.js';

interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

export default function astro({ config, devServer }: AstroPluginOptions): Plugin {
  return {
    name: '@astrojs/vite-plugin-astro-postprocess',
    async transform(code, id) {
      // Currently only supported in ".astro" & ".md" files
      if (!id.endsWith('.astro') && !id.endsWith('.md')) {
        return null;
      }
      // Optimization: only run on a probably match
      // Open this up if need for post-pass extends past fetchContent
      if (!code.includes('fetchContent')) {
        return null;
      }
      // Handle the second-pass JS AST Traversal
      const result = await babel.transformAsync(code, {
        sourceType: 'module',
        sourceMaps: true,
        plugins: [
          () => {
            return {
              visitor: {
                StringLiteral(path: babelTraverse.NodePath<t.StringLiteral>) {
                  if (
                    path.parent.type !== 'CallExpression' ||
                    path.parent.callee.type !== 'MemberExpression' ||
                    (path.parent.callee.object as any).name !== 'Astro' ||
                    (path.parent.callee.property as any).name !== 'fetchContent'
                  ) {
                    return;
                  }
                  const { value } = path.node;
                  if (/[a-z]\:\/\//.test(value)) {
                    return;
                  }
                    path.replaceWith({
                      type: 'CallExpression',
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'MetaProperty', meta: { type: 'Identifier', name: 'import' }, property: { type: 'Identifier', name: 'meta' } },
                        property: { type: 'Identifier', name: 'globEager' },
                        computed: false,
                      },
                      arguments: [path.node],
                    } as any);
                },
              },
            };
          },
        ],
      });
      // Undocumented baby behavior, but possible according to Babel types.
      if (!result || !result.code) {
        return null;
      }
      return { code: result.code, map: result.map };
    },
  };
}