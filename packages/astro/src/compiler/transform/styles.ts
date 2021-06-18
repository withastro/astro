import type { TransformOptions, Transformer } from '../../@types/transformer';
import type { TemplateNode } from '@astrojs/parser';

import crypto from 'crypto';
import { createRequire } from 'module';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss, { Plugin } from 'postcss';
import postcssKeyframes from 'postcss-icss-keyframes';
import findUp from 'find-up';
import sass from 'sass';
import { error, LogOptions } from '../../logger.js';
import astroScopedStyles, { NEVER_SCOPED_TAGS } from './postcss-scoped-styles/index.js';
import slash from 'slash';

type StyleType = 'css' | 'scss' | 'sass' | 'postcss';

declare global {
  interface ImportMeta {
    /** https://nodejs.org/api/esm.html#esm_import_meta_resolve_specifier_parent */
    resolve(specifier: string, parent?: string): Promise<any>;
  }
}

const getStyleType: Map<string, StyleType> = new Map([
  ['.css', 'css'],
  ['.pcss', 'postcss'],
  ['.sass', 'sass'],
  ['.scss', 'scss'],
  ['css', 'css'],
  ['sass', 'sass'],
  ['scss', 'scss'],
  ['text/css', 'css'],
  ['text/sass', 'sass'],
  ['text/scss', 'scss'],
]);

/** Should be deterministic, given a unique filename */
function hashFromFilename(filename: string): string {
  const hash = crypto.createHash('sha256');
  return hash
    .update(slash(filename))
    .digest('base64')
    .toString()
    .replace(/[^A-Za-z0-9-]/g, '')
    .substr(0, 8);
}

export interface StyleTransformResult {
  css: string;
  type: StyleType;
}

interface StylesMiniCache {
  nodeModules: Map<string, string>; // filename: node_modules location
}

/** Simple cache that only exists in memory per-run. Prevents the same lookups from happening over and over again within the same build or dev server session. */
const miniCache: StylesMiniCache = {
  nodeModules: new Map<string, string>(),
};

export interface TransformStyleOptions {
  logging: LogOptions;
  type?: string;
  filename: string;
  scopedClass: string;
  tailwindConfig?: string;
}

/** given a class="" string, does it contain a given class? */
function hasClass(classList: string, className: string): boolean {
  if (!className) return false;
  for (const c of classList.split(' ')) {
    if (className === c.trim()) return true;
  }
  return false;
}

/** Convert styles to scoped CSS */
async function transformStyle(code: string, { logging, type, filename, scopedClass, tailwindConfig }: TransformStyleOptions): Promise<StyleTransformResult> {
  let styleType: StyleType = 'css'; // important: assume CSS as default
  if (type) {
    styleType = getStyleType.get(type) || styleType;
  }

  // add file path to includePaths
  let includePaths: string[] = [path.dirname(filename)];

  // include node_modules to includePaths (allows @use-ing node modules, if it can be located)
  const cachedNodeModulesDir = miniCache.nodeModules.get(filename);
  if (cachedNodeModulesDir) {
    includePaths.push(cachedNodeModulesDir);
  } else {
    const nodeModulesDir = await findUp('node_modules', { type: 'directory', cwd: path.dirname(filename) });
    if (nodeModulesDir) {
      miniCache.nodeModules.set(filename, nodeModulesDir);
      includePaths.push(nodeModulesDir);
    }
  }

  // 1. Preprocess (currently only Sass supported)
  let css = '';
  switch (styleType) {
    case 'css': {
      css = code;
      break;
    }
    case 'sass':
    case 'scss': {
      css = sass.renderSync({ data: code, includePaths }).css.toString('utf8');
      break;
    }
    default: {
      throw new Error(`Unsupported: <style lang="${styleType}">`);
    }
  }

  // 2. Post-process (PostCSS)
  const postcssPlugins: Plugin[] = [];

  // 2a. Tailwind (only if project uses Tailwind)
  if (tailwindConfig) {
    try {
      const require = createRequire(import.meta.url);
      const tw = require.resolve('tailwindcss', { paths: [import.meta.url, process.cwd()] });
      postcssPlugins.push(require(tw)(tailwindConfig) as any);
    } catch (err) {
      error(logging, 'transform', err);
      throw new Error(`tailwindcss not installed. Try running \`npm install tailwindcss\` and trying again.`);
    }
  }

  // 2b. Astro scoped styles (always on)
  postcssPlugins.push(astroScopedStyles({ className: scopedClass }));

  // 2c. Scoped @keyframes
  postcssPlugins.push(
    postcssKeyframes({
      generateScopedName(keyframesName) {
        return `${keyframesName}-${scopedClass}`;
      },
    })
  );

  // 2d. Autoprefixer (always on)
  postcssPlugins.push(autoprefixer());

  // 2e. Run PostCSS
  css = await postcss(postcssPlugins)
    .process(css, { from: filename, to: undefined })
    .then((result) => result.css);

  return { css, type: styleType };
}

/** For a given node, inject or append a `scopedClass` to its `class` attribute */
function injectScopedClassAttribute(node: TemplateNode, scopedClass: string, attribute = 'class') {
  if (!node.attributes) node.attributes = [];
  const classIndex = node.attributes.findIndex(({ name }: any) => name === attribute);
  if (classIndex === -1) {
    // 3a. element has no class="" attribute; add one and append scopedClass
    node.attributes.push({ start: -1, end: -1, type: 'Attribute', name: attribute, value: [{ type: 'Text', raw: scopedClass, data: scopedClass }] });
  } else {
    // 3b. element has class=""; append scopedClass
    const attr = node.attributes[classIndex];
    for (let k = 0; k < attr.value.length; k++) {
      if (attr.value[k].type === 'Text') {
        // don‘t add same scopedClass twice
        if (!hasClass(attr.value[k].data, scopedClass)) {
          // string literal
          attr.value[k].raw += ' ' + scopedClass;
          attr.value[k].data += ' ' + scopedClass;
        }
      } else if (attr.value[k].type === 'MustacheTag' && attr.value[k]) {
        // don‘t add same scopedClass twice (this check is a little more basic, but should suffice)
        if (!attr.value[k].expression.codeChunks[0].includes(`' ${scopedClass}'`)) {
          // MustacheTag
          // FIXME: this won't work when JSX element can appear in attributes (rare but possible).
          attr.value[k].expression.codeChunks[0] = `(${attr.value[k].expression.codeChunks[0]}) + ' ${scopedClass}'`;
        }
      }
    }
  }
}

/** Transform <style> tags */
export default function transformStyles({ compileOptions, filename, fileID }: TransformOptions): Transformer {
  const styleNodes: TemplateNode[] = []; // <style> tags to be updated
  const styleTransformPromises: Promise<StyleTransformResult>[] = []; // async style transform results to be finished in finalize();
  const scopedClass = `astro-${hashFromFilename(fileID)}`; // this *should* generate same hash from fileID every time
  const nodesToScope = new Set<TemplateNode>();

  return {
    visitors: {
      html: {
        InlineComponent: {
          enter(node) {
            if (node.name !== 'Markdown') return;
            injectScopedClassAttribute(node, scopedClass, '$scope');
          },
        },
        Element: {
          enter(node) {
            // 1. if <style> tag, transform it and continue to next node
            if (node.name === 'style') {
              // Same as ast.css (below)
              const code = Array.isArray(node.children) ? node.children.map(({ data }: any) => data).join('\n') : '';
              if (!code) return;
              const langAttr = (node.attributes || []).find(({ name }: any) => name === 'lang');
              styleNodes.push(node);
              styleTransformPromises.push(
                transformStyle(code, {
                  logging: compileOptions.logging,
                  type: (langAttr && langAttr.value[0] && langAttr.value[0].data) || undefined,
                  filename,
                  scopedClass,
                  tailwindConfig: compileOptions.astroConfig.devOptions.tailwindConfig,
                })
              );
              return;
            }

            // 2. add scoped HTML classes
            if (NEVER_SCOPED_TAGS.has(node.name) || node.name.toLowerCase() === '!doctype') {
              return; // only continue if this is NOT a <script> tag, etc.
            }
            // Note: currently we _do_ scope web components/custom elements. This seems correct?
            nodesToScope.add(node);
          },
        },
      },
      // CSS: compile styles, apply CSS Modules scoping
      css: {
        Style: {
          enter(node) {
            // Same as ast.html (above)
            // Note: this is duplicated from html because of the compiler we‘re using; in a future version we should combine these
            if (!node.content || !node.content.styles) return;
            const code = node.content.styles;
            const langAttr = (node.attributes || []).find(({ name }: any) => name === 'lang');
            styleNodes.push(node);
            styleTransformPromises.push(
              transformStyle(code, {
                logging: compileOptions.logging,
                type: (langAttr && langAttr.value[0] && langAttr.value[0].data) || undefined,
                filename,
                scopedClass,
              })
            );
          },
        },
      },
    },
    async finalize() {
      const styleTransforms = await Promise.all(styleTransformPromises);
      
      // If we DO have styles, let's inject the scoped `class` attribute
      // Otherwise, our final optimization is easier if we skip this
      if (styleTransforms.length > 0) {
        for (const node of nodesToScope.values()) {
          injectScopedClassAttribute(node, scopedClass);
        }
      }

      styleTransforms.forEach((result, n) => {
        if (styleNodes[n].attributes) {
          // 1. Replace with final CSS
          const isHeadStyle = !styleNodes[n].content;
          if (isHeadStyle) {
            // Note: <style> tags in <head> have different attributes/rules, because of the parser. Unknown why
            (styleNodes[n].children as any) = [{ ...(styleNodes[n].children as any)[0], data: result.css }];
          } else {
            styleNodes[n].content.styles = result.css;
          }

          // 2. Update <style> attributes
          const styleTypeIndex = styleNodes[n].attributes.findIndex(({ name }: any) => name === 'type');
          // add type="text/css"
          if (styleTypeIndex !== -1) {
            styleNodes[n].attributes[styleTypeIndex].value[0].raw = 'text/css';
            styleNodes[n].attributes[styleTypeIndex].value[0].data = 'text/css';
          } else {
            styleNodes[n].attributes.push({ name: 'type', type: 'Attribute', value: [{ type: 'Text', raw: 'text/css', data: 'text/css' }] });
          }
          // remove lang="*"
          const styleLangIndex = styleNodes[n].attributes.findIndex(({ name }: any) => name === 'lang');
          if (styleLangIndex !== -1) styleNodes[n].attributes.splice(styleLangIndex, 1);
          // TODO: add data-astro for later
          // styleNodes[n].attributes.push({ name: 'data-astro', type: 'Attribute', value: true });
        }
      });
    },
  };
}
