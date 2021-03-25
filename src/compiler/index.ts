import type { LogOptions } from '../logger.js';

import path from 'path';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { CompileResult, TransformResult } from '../@types/astro';
import { parse } from '../parser/index.js';
import { createMarkdownHeadersCollector } from '../micromark-collect-headers.js';
import { encodeMarkdown } from '../micromark-encode.js';
import { defaultLogOptions } from '../logger.js';
import { optimize } from './optimize/index.js';
import { codegen } from './codegen.js';

interface CompileOptions {
  logging: LogOptions;
  resolve: (p: string) => Promise<string>;
}

const defaultCompileOptions: CompileOptions = {
  logging: defaultLogOptions,
  resolve: (p: string) => Promise.resolve(p),
};

function internalImport(internalPath: string) {
  return `/_astro_internal/${internalPath}`;
}

interface ConvertAstroOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}

async function convertAstroToJsx(template: string, opts: ConvertAstroOptions): Promise<TransformResult> {
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
  const { data: frontmatterData, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();
  const mdHtml = micromark(content, {
    allowDangerousHtml: true,
    extensions: [gfmSyntax()],
    htmlExtensions: [gfmHtml, encodeMarkdown, headersExtension],
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

  const raw = `---
  ${imports}
  ${frontmatterData.layout ? `export const __layout = ${JSON.stringify(frontmatterData.layout)};` : ''}
  export const __content = ${stringifiedSetupContext};
---
<section>${mdHtml}</section>`;

  const convertOptions = { compileOptions, filename, fileID };

  return convertAstroToJsx(raw, convertOptions);
}

type SupportedExtensions = '.astro' | '.md';

async function transformFromSource(
  contents: string,
  { compileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<TransformResult> {
  const fileID = path.relative(projectRoot, filename);
  switch (path.extname(filename) as SupportedExtensions) {
    case '.astro':
      return convertAstroToJsx(contents, { compileOptions, filename, fileID });
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
  const isPage = path.extname(filename) === '.md' || sourceJsx.items.some((item) => item.name === 'html');
  // sort <style> tags first
  sourceJsx.items.sort((a, b) => (a.name === 'style' && b.name !== 'style' ? -1 : 0));

  // return template
  let modJsx = `
import fetch from 'node-fetch';

// <script astro></script>
${sourceJsx.imports.join('\n')}

// \`__render()\`: Render the contents of the Astro module.
import { h, Fragment } from '${internalImport('h.js')}';
async function __render(props, ...children) { 
  ${sourceJsx.script}
  return h(Fragment, null, ${sourceJsx.items.map(({ jsx }) => jsx).join(',')}); 
}
export default __render;
`;

  if (isPage) {
    modJsx += `
// \`__renderPage()\`: Render the contents of the Astro module as a page. This is a special flow,
// triggered by loading a component directly by URL. 
export async function __renderPage({request, children, props}) {

  const currentChild = {
    setup: typeof setup === 'undefined' ? (passthrough) => passthrough : setup,
    layout: typeof __layout === 'undefined' ? undefined : __layout,
    content: typeof __content === 'undefined' ? undefined : __content,
    __render,
  };

  await currentChild.setup({request});
  const childBodyResult = await currentChild.__render(props, children);

  // find layout, if one was given.
  if (currentChild.layout) {
    const layoutComponent = (await import('/_astro/layouts/' + currentChild.layout.replace(/.*layouts\\//, "").replace(/\.astro$/, '.js')));
    return layoutComponent.__renderPage({
      request,
      props: {content: currentChild.content},
      children: [childBodyResult],
    });
  } 

  return childBodyResult;
};\n`;
  } else {
    modJsx += `
export async function __renderPage() { throw new Error("No <html> page element found!"); }\n`;
  }

  return {
    result: sourceJsx,
    contents: modJsx,
  };
}
