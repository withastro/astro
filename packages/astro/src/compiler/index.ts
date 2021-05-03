import 'source-map-support/register.js';
import type { CompileResult, TransformResult } from '../@types/astro';
import type { CompileOptions } from '../@types/compiler.js';

import path from 'path';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';

import { parse } from 'astro-parser';
import { createMarkdownHeadersCollector } from './markdown/micromark-collect-headers.js';
import { encodeMarkdown } from './markdown/micromark-encode.js';
import { encodeAstroMdx } from './markdown/micromark-mdx-astro.js';
import { transform } from './transform/index.js';
import { codegen } from './codegen/index.js';

export { scopeRule } from './transform/postcss-scoped-styles/index.js'

/** Return Astro internal import URL */
function internalImport(internalPath: string) {
  return `/_astro_internal/${internalPath}`;
}

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
async function convertAstroToJsx(template: string, opts: ConvertAstroOptions): Promise<TransformResult> {
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
export async function convertMdToAstroSource(contents: string): Promise<string> {
  const { data: frontmatterData, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();
  const { htmlAstro, mdAstro } = encodeAstroMdx();
  const mdHtml = micromark(content, {
    allowDangerousHtml: true,
    extensions: [gfmSyntax(), ...htmlAstro],
    htmlExtensions: [gfmHtml, encodeMarkdown, headersExtension, mdAstro],
  });

  // TODO: Warn if reserved word is used in "frontmatterData"
  const contentData: any = {
    ...frontmatterData,
    headers,
    source: content,
  };

  let imports = '';
  for (let [ComponentName, specifier] of Object.entries(frontmatterData.import || {})) {
    imports += `import ${ComponentName} from '${specifier}';\n`;
  }

  // </script> can't be anywhere inside of a JS string, otherwise the HTML parser fails.
  // Break it up here so that the HTML parser won't detect it.
  const stringifiedSetupContext = JSON.stringify(contentData).replace(/\<\/script\>/g, `</scrip" + "t>`);

  return `---
  ${imports}
  ${frontmatterData.layout ? `import {__renderPage as __layout} from '${frontmatterData.layout}';` : 'const __layout = undefined;'}
  export const __content = ${stringifiedSetupContext};
---
<section>${mdHtml}</section>`;
}

/**
 * .md -> .jsx
 * Core function processing Markdown, but along the way also calls convertAstroToJsx().
 */
async function convertMdToJsx(
  contents: string,
  { compileOptions, filename, fileID }: { compileOptions: CompileOptions; filename: string; fileID: string }
): Promise<TransformResult> {
  const raw = await convertMdToAstroSource(contents);
  const convertOptions = { compileOptions, filename, fileID };
  return await convertAstroToJsx(raw, convertOptions);
}

type SupportedExtensions = '.astro' | '.md';

/** Given a file, process it either as .astro or .md. */
async function transformFromSource(
  contents: string,
  { compileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<TransformResult> {
  const fileID = path.relative(projectRoot, filename);
  switch (path.extname(filename) as SupportedExtensions) {
    case '.astro':
      return await convertAstroToJsx(contents, { compileOptions, filename, fileID });
    case '.md':
      return await convertMdToJsx(contents, { compileOptions, filename, fileID });
    default:
      throw new Error('Not Supported!');
  }
}

/** Return internal code that gets processed in Snowpack */
export async function compileComponent(
  source: string,
  { compileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<CompileResult> {
  const result = await transformFromSource(source, { compileOptions, filename, projectRoot });

  // return template
  let modJsx = `
import fetch from 'node-fetch';

// <script astro></script>
${result.imports.join('\n')}

// \`__render()\`: Render the contents of the Astro module.
import { h, Fragment } from '${internalImport('h.js')}';
const __astroRequestSymbol = Symbol('astro.request');
async function __render(props, ...children) {
  const Astro = {
    request: props[__astroRequestSymbol]
  };

  ${result.script}
  return h(Fragment, null, ${result.html});
}
export default __render;

${result.createCollection || ''}

// \`__renderPage()\`: Render the contents of the Astro module as a page. This is a special flow,
// triggered by loading a component directly by URL.
export async function __renderPage({request, children, props}) {
  const currentChild = {
    layout: typeof __layout === 'undefined' ? undefined : __layout,
    content: typeof __content === 'undefined' ? undefined : __content,
    __render,
  };

  props[__astroRequestSymbol] = request;
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
    contents: modJsx,
    css: result.css,
  };
}
