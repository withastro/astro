import 'source-map-support/register.js';
import type { CompileResult, TransformResult } from '../@types/astro';
import type { CompileOptions } from '../@types/compiler.js';

import path from 'path';
import { renderMarkdownWithFrontmatter } from '@astrojs/markdown-support';

import { parse } from '@astrojs/parser';
import { transform } from './transform/index.js';
import { codegen } from './codegen/index.js';

export { scopeRule } from './transform/postcss-scoped-styles/index.js';

interface ConvertAstroOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}

/**
 * .astro -> .jsx
 * Core function processing .astro files. Initiates all 3 phases of compilation:
 * 1. Parse
 * 2. Transform
 * 3. Codegen
 */
export async function convertAstroToJsx(template: string, opts: ConvertAstroOptions): Promise<TransformResult> {
  const { filename } = opts;

  // 1. Parse
  const ast = parse(template, {
    filename,
  });

  // 2. Transform the AST
  await transform(ast, opts);

  // 3. Turn AST into JSX
  return await codegen(ast, opts);
}

/**
 * .md -> .astro source
 */
export async function convertMdToAstroSource(contents: string, { filename }: { filename: string }): Promise<string> {
  let {
    content,
    frontmatter: { layout, ...frontmatter },
    ...data
  } = await renderMarkdownWithFrontmatter(contents);

  if (frontmatter['astro'] !== undefined) {
    throw new Error(`"astro" is a reserved word but was used as a frontmatter value!\n\tat ${filename}`);
  }
  const contentData: any = {
    ...frontmatter,
    ...data,
  };
  // </script> can't be anywhere inside of a JS string, otherwise the HTML parser fails.
  // Break it up here so that the HTML parser won't detect it.
  const stringifiedSetupContext = JSON.stringify(contentData).replace(/\<\/script\>/g, `</scrip" + "t>`);

  return `---
${layout ? `import {__renderPage as __layout} from '${layout}';` : 'const __layout = undefined;'}
export const __content = ${stringifiedSetupContext};
---
${content}`;
}

/**
 * .md -> .jsx
 * Core function processing Markdown, but along the way also calls convertAstroToJsx().
 */
async function convertMdToJsx(
  contents: string,
  { compileOptions, filename, fileID }: { compileOptions: CompileOptions; filename: string; fileID: string }
): Promise<TransformResult> {
  const raw = await convertMdToAstroSource(contents, { filename });
  const convertOptions = { compileOptions, filename, fileID };
  return await convertAstroToJsx(raw, convertOptions);
}

/** Given a file, process it either as .astro, .md */
async function transformFromSource(
  contents: string,
  { compileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<TransformResult> {
  const fileID = path.relative(projectRoot, filename);
  switch (true) {
    case filename.slice(-6) === '.astro':
      return await convertAstroToJsx(contents, { compileOptions, filename, fileID });

    case filename.slice(-3) === '.md':
      return await convertMdToJsx(contents, { compileOptions, filename, fileID });

    default:
      throw new Error('Not Supported!');
  }
}

/** Return internal code that gets processed in Snowpack */
interface CompileComponentOptions {
  compileOptions: CompileOptions;
  filename: string;
  projectRoot: string;
  isPage?: boolean;
}
export async function compileComponent(source: string, { compileOptions, filename, projectRoot, isPage }: CompileComponentOptions): Promise<CompileResult> {
  const result = await transformFromSource(source, { compileOptions, filename, projectRoot });
  const site = compileOptions.astroConfig.buildOptions.site || `http://localhost:${compileOptions.astroConfig.devOptions.port}`;

  // return template
  let moduleJavaScript = `
import fetch from 'node-fetch';

// <script astro></script>
${result.imports.join('\n')}

// \`__render()\`: Render the contents of the Astro module.
import { h, Fragment } from 'astro/dist/internal/h.js';
const __astroInternal = Symbol('astro.internal');
async function __render(props, ...children) {
  const Astro = {
    css: props[__astroInternal]?.css || [],
    request: props[__astroInternal]?.request || {},
    site: new URL('/', ${JSON.stringify(site)}),
    isPage: props[__astroInternal]?.isPage || false
  };

  ${result.script}
  return h(Fragment, null, ${result.html});
}
export default { isAstroComponent: true, __render };

${result.createCollection || ''}

// \`__renderPage()\`: Render the contents of the Astro module as a page. This is a special flow,
// triggered by loading a component directly by URL.
export async function __renderPage({request, children, props, css}) {
  const currentChild = {
    isAstroComponent: true,
    layout: typeof __layout === 'undefined' ? undefined : __layout,
    content: typeof __content === 'undefined' ? undefined : __content,
    __render,
  };

  props[__astroInternal] = {
    request,
    css,
    isPage: true
  };

  const childBodyResult = await currentChild.__render(props, children);

  // find layout, if one was given.
  if (currentChild.layout) {
    return currentChild.layout({
      request,
      props: {content: currentChild.content},
      children: [childBodyResult],
    });
  }

  return childBodyResult;
};\n`;

  return {
    result,
    contents: moduleJavaScript,
    css: result.css,
  };
}
