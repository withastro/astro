import type { LogOptions } from './logger.js';

import path from 'path';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { CompileResult, TransformResult } from './@types/astro';
import { parse } from './compiler/index.js';
import { createMarkdownHeadersCollector } from './micromark-collect-headers.js';
import { encodeMarkdown } from './micromark-encode.js';
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
  const { data: _frontmatterData, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();
  const mdHtml = micromark(content, {
    allowDangerousHtml: true,
    extensions: [gfmSyntax()],
    htmlExtensions: [gfmHtml, encodeMarkdown, headersExtension],
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

  let imports = '';
  for(let [ComponentName, specifier] of Object.entries(_frontmatterData.import || {})) {
    imports += `import ${ComponentName} from '${specifier}';\n`;
  }

  // </script> can't be anywhere inside of a JS string, otherwise the HTML parser fails.
  // Break it up here so that the HTML parser won't detect it.
  const stringifiedSetupContext = JSON.stringify(setupContext).replace(/\<\/script\>/g, `</scrip" + "t>`);

  const raw =  `---
  ${imports}
  ${_frontmatterData.layout ? `export const layout = ${JSON.stringify(_frontmatterData.layout)};` : ''}
  export function setup({context}) {
    return {context: ${stringifiedSetupContext} };
  }
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

  // sort <style> tags first
  // TODO: remove these and inject in <head>
  const isPage = sourceJsx.items.some((item) => item.name === 'html');
  sourceJsx.items.sort((a, b) => (a.name === 'style' && b.name !== 'style' ? -1 : 0));

  // return template
  let modJsx = `
// <script astro></script>
${sourceJsx.script}

// \`__render()\`: Render the contents of the Astro module.
import { h, Fragment } from '${internalImport('h.js')}';
function __render(props, __children) { 
  const children = __children && __children.join('');
  ${sourceJsx.props.map((p) => `${p} = props.${p} ?? ${p};`).join('\n')}
  return h(Fragment, null, ${sourceJsx.items.map(({ jsx }) => jsx).join(',')}); 
}
export default __render;
`;

  if (isPage) {
    modJsx += `
// \`__renderPage()\`: Render the contents of the Astro module as a page. This is a special flow,
// triggered by loading a component directly by URL. 
export async function __renderPage({request, children}) {
  const currentChild = {
    setup: typeof setup === 'undefined' ? (passthrough) => passthrough : setup,
    __render,
  };

  const fetch = (await import('node-fetch')).default;
  await currentChild.setup({request, fetch});
  const childBodyResult = await currentChild.__render({});
  return childBodyResult;
};\n`;
  } else {
    modJsx += `
export async function __renderPage() { throw new Error("No <html> page element found!"); }\n`;
  }

  console.log(modJsx);

  return {
    result: sourceJsx,
    contents: modJsx,
  };
}
