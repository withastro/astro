import type { LogOptions } from './logger.js';

import path from 'path';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { CompileResult, TransformResult } from './@types/astro';
import { parse } from './compiler/index.js';
import { createMarkdownHeadersCollector } from './micromark-collect-headers.js';
import { defaultLogOptions } from './logger.js';
import { optimize } from './optimize/index.js';
import { codegen } from './codegen/index.js';

interface CompileOptions {
  logging: LogOptions;
  resolve: (p: string) => string;
}

const defaultCompileOptions: CompileOptions = {
  logging: defaultLogOptions,
  resolve: (p: string) => p,
};

function internalImport(internalPath: string) {
  return `/__hmx_internal__/${internalPath}`;
}

interface ConvertHmxOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}

async function convertHmxToJsx(template: string, opts: ConvertHmxOptions): Promise<TransformResult> {
  const { filename } = opts;

  // 1. Parse
  const ast = parse(template, {
    filename,
  });

  // 2. Optimize the AST
  await optimize(ast, opts);

  // Turn AST into JSX
  return await codegen(ast, opts);
}

async function convertMdToJsx(
  contents: string,
  { compileOptions, filename, fileID }: { compileOptions: CompileOptions; filename: string; fileID: string }
): Promise<TransformResult> {
  const { data: _frontmatterData, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();
  const mdHtml = micromark(content, {
    extensions: [gfmSyntax()],
    htmlExtensions: [gfmHtml, headersExtension],
  });

  const setupContext = {
    ..._frontmatterData,
    content: {
      frontmatter: _frontmatterData,
      headers,
      source: content,
      html: mdHtml,
    },
  };

  // </script> can't be anywhere inside of a JS string, otherwise the HTML parser fails.
  // Break it up here so that the HTML parser won't detect it.
  const stringifiedSetupContext = JSON.stringify(setupContext).replace(/\<\/script\>/g, `</scrip" + "t>`);

  return convertHmxToJsx(
    `<script astro>
      ${_frontmatterData.layout ? `export const layout = ${JSON.stringify(_frontmatterData.layout)};` : ''}
      export function setup({context}) {
        return {context: ${stringifiedSetupContext} };
      }
    </script><slot:head></slot:head><slot:body><section>{${JSON.stringify(mdHtml)}}</section></slot:body>`,
    { compileOptions, filename, fileID }
  );
}

async function transformFromSource(
  contents: string,
  { compileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<TransformResult> {
  const fileID = path.relative(projectRoot, filename);
  switch (path.extname(filename)) {
    case '.hmx':
      return convertHmxToJsx(contents, { compileOptions, filename, fileID });
    case '.md':
      return convertMdToJsx(contents, { compileOptions, filename, fileID });
    default:
      throw new Error('Not Supported!');
  }
}

export async function compileComponent(
  source: string,
  { compileOptions = defaultCompileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<CompileResult> {
  const sourceJsx = await transformFromSource(source, { compileOptions, filename, projectRoot });
  const headItem = sourceJsx.head;
  const bodyItem = sourceJsx.body;
  const headItemJsx = !headItem ? 'null' : headItem.jsx;
  const bodyItemJsx = !bodyItem ? 'null' : bodyItem.jsx;

  // sort <style> tags first
  // TODO: remove these and inject in <head>
  sourceJsx.items.sort((a, b) => (a.name === 'style' && b.name !== 'style' ? -1 : 0));

  // return template
  let modJsx = `
// <script astro></script>
${sourceJsx.script}

// \`__render()\`: Render the contents of the HMX module. "<slot:*>" elements are not 
// included (see below).
import { h, Fragment } from '${internalImport('h.js')}';
export default function __render(props) { return h(Fragment, null, ${sourceJsx.items.map(({ jsx }) => jsx).join(',')}); }

// <slot:*> render functions
export function __slothead(context, child) { return h(Fragment, null, ${headItemJsx}); }
export function __slotbody(context, child) { return h(Fragment, null, ${bodyItemJsx}); }
`;

  if (headItemJsx || bodyItemJsx) {
    modJsx += `
// \`__renderPage()\`: Render the contents of the HMX module as a page. This is a special flow,
// triggered by loading a component directly by URL. 
// If the page exports a defined "layout", then load + render those first. "context", "slot:head",
// and "slot:body" should all inherit from parent layouts, merging together in the correct order.
export async function __renderPage({request, children}) {
  const currentChild = {
    __slothead, 
    __slotbody, 
    setup: typeof setup === 'undefined' ? (passthrough) => passthrough : setup,
    layout: typeof layout === 'undefined' ? undefined : layout,
  };

  // find all layouts, going up the layout chain.
  if (currentChild.layout) {
    const layoutComponent = (await import('/_hmx/layouts/' + layout.replace(/.*layouts\\//, "").replace(/\.hmx$/, '.js')));
    return layoutComponent.__renderPage({
      request,
      children: [currentChild, ...children],
    });
  } 
  
  const isRoot = true;
  const merge = (await import('deepmerge')).default;
  const fetch = (await import('node-fetch')).default;

  // call all children setup scripts, in order, and return.
  let mergedContext = {};
  for (const child of [currentChild, ...children]) {
    const childSetupResult = await child.setup({request, fetch, context: mergedContext});
    mergedContext = childSetupResult.context ? merge(mergedContext, childSetupResult.context) : mergedContext;
  }
  
  Object.freeze(mergedContext);

  let headResult;
  let bodyResult;
  for (const child of children.reverse()) {
    headResult = await child.__slothead(mergedContext, headResult);
    bodyResult = await child.__slotbody(mergedContext, bodyResult);
  }
  return h(Fragment, null, [
    h("head", null, currentChild.__slothead(mergedContext, headResult)),
    h("body", null, currentChild.__slotbody(mergedContext, bodyResult)),
  ]);
};\n`;
  }

  return {
    result: sourceJsx,
    contents: modJsx,
  };
}
