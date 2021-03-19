import crypto from 'crypto';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import sass from 'sass';
import { Optimizer } from '../@types/optimizer';
import type { TemplateNode } from '../compiler/interfaces';

type StyleType = 'text/css' | 'text/scss' | 'text/sass' | 'text/postcss';

const getStyleType: Map<string, StyleType> = new Map([
  ['.css', 'text/css'],
  ['.pcss', 'text/postcss'],
  ['.sass', 'text/sass'],
  ['.scss', 'text/scss'],
  ['css', 'text/css'],
  ['postcss', 'text/postcss'],
  ['sass', 'text/sass'],
  ['scss', 'text/scss'],
  ['text/css', 'text/css'],
  ['text/postcss', 'text/postcss'],
  ['text/sass', 'text/sass'],
  ['text/scss', 'text/scss'],
]);

const SASS_OPTIONS: Partial<sass.Options> = {
  outputStyle: 'compressed',
};

/** Should be deterministic, given a unique filename */
function hashFromFilename(filename: string): string {
  const hash = crypto.createHash('sha256');
  return hash
    .update(filename.replace(/\\/g, '/'))
    .digest('base64')
    .toString()
    .replace(/[^A-Za-z0-9-]/g, '')
    .substr(0, 8);
}

export interface StyleTransformResult {
  css: string;
  cssModules: Map<string, string>;
  type: StyleType;
}

async function transformStyle(code: string, { type, filename, fileID }: { type?: string; filename: string; fileID: string }): Promise<StyleTransformResult> {
  let styleType: StyleType = 'text/css'; // important: assume CSS as default
  if (type) {
    styleType = getStyleType.get(type) || styleType;
  }

  let css = '';
  switch (styleType) {
    case 'text/css': {
      css = code;
      break;
    }
    case 'text/sass':
    case 'text/scss': {
      css = sass
        .renderSync({
          ...SASS_OPTIONS,
          data: code,
          includePaths: [path.dirname(filename)],
        })
        .css.toString('utf8');
      break;
    }
    case 'text/postcss': {
      css = code; // TODO
      break;
    }
    default: {
      throw new Error(`Unsupported: <style type="${styleType}">`);
    }
  }

  const cssModules = new Map<string, string>();

  css = await postcss([
    postcssModules({
      generateScopedName(name: string) {
        return `${name}__${hashFromFilename(fileID)}`;
      },
      getJSON(_: string, json: any) {
        Object.entries(json).forEach(([k, v]: any) => {
          if (k !== v) cssModules.set(k, v);
        });
      },
    }),
    autoprefixer(),
  ])
    .process(css, { from: filename, to: undefined })
    .then((result) => result.css);

  return {
    css,
    cssModules,
    type: styleType,
  };
}

export default function ({ filename, fileID }: { filename: string; fileID: string }): Optimizer {
  const elementNodes: TemplateNode[] = []; //  elements that need CSS Modules class names
  const styleNodes: TemplateNode[] = []; // <style> tags to be updated
  const styleTransformPromises: Promise<StyleTransformResult>[] = []; // async style transform results to be finished in finalize();
  let rootNode: TemplateNode; // root node which needs <style> tags

  return {
    visitors: {
      html: {
        Element: {
          enter(node) {
            // Find the root node to inject the <style> tag in later
            if (node.name === 'head') {
              rootNode = node; // If this is <head>, this is what we want. Always take this if found. However, this may not always exist (it won’t for Component subtrees).
            } else if (!rootNode) {
              rootNode = node; // If no <head> (yet), then take the first element we come to and assume it‘s the “root” (but if we find a <head> later, then override this per the above)
            }

            for (let attr of node.attributes) {
              if (attr.name !== 'class') continue;
              elementNodes.push(node);
            }
          },
        },
      },
      // CSS: compile styles, apply CSS Modules scoping
      css: {
        Style: {
          enter(node) {
            const code = node.content.styles;
            const typeAttr = (node.attributes || []).find(({ name }: { name: string }) => name === 'type');
            styleNodes.push(node);
            styleTransformPromises.push(transformStyle(code, { type: (typeAttr.value[0] && typeAttr.value[0].raw) || undefined, filename, fileID }));

            // TODO: we should delete the old untransformed <style> node after we’re done.
            // However, the svelte parser left it in ast.css, not ast.html. At the final step, this just gets ignored, so it will be deleted, in a sense.
            // If we ever end up scanning ast.css for something else, then we’ll need to actually delete the node (or transform it to the processed version)
          },
        },
      },
    },
    async finalize() {
      const allCssModules = new Map<string, string>(); // note: this may theoretically have conflicts, but when written, it shouldn’t because we’re processing everything per-component (if we change this to run across the whole document at once, revisit this)
      const styleTransforms = await Promise.all(styleTransformPromises);

      if (!rootNode) {
        throw new Error(`No root node found`); // TODO: remove this eventually; we should always find it, but for now alert if there’s a bug in our code
      }

      // 1. transform <style> tags
      styleTransforms.forEach((result, n) => {
        if (styleNodes[n].attributes) {
          // Add to global CSS Module class list for step 2
          for (const [k, v] of result.cssModules) {
            allCssModules.set(k, v);
          }

          // Update original <style> node with finished results
          styleNodes[n].attributes = styleNodes[n].attributes.map((attr: any) => {
            if (attr.name === 'type') {
              attr.value[0].raw = 'text/css';
              attr.value[0].data = 'text/css';
            }
            return attr;
          });
        }
        styleNodes[n].content.styles = result.css;
      });

      // 2. inject finished <style> tags into root node
      rootNode.children = [...styleNodes, ...(rootNode.children || [])];

      // 3. update HTML classes
      for (let i = 0; i < elementNodes.length; i++) {
        if (!elementNodes[i].attributes) continue;
        const node = elementNodes[i];
        for (let j = 0; j < node.attributes.length; j++) {
          if (node.attributes[j].name !== 'class') continue;
          const attr = node.attributes[j];
          for (let k = 0; k < attr.value.length; k++) {
            if (attr.value[k].type !== 'Text') continue;
            const elementClassNames = (attr.value[k].raw as string)
              .split(' ')
              .map((c) => {
                let className = c.trim();
                return allCssModules.get(className) || className; // if className matches exactly, replace; otherwise keep original
              })
              .join(' ');
            attr.value[k].raw = elementClassNames;
            attr.value[k].data = elementClassNames;
          }
        }
      }
    },
  };
}
