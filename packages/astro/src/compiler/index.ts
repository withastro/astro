import type { CompileResult, TransformResult } from '../@types/astro';
import type { CompileOptions } from '../@types/compiler.js';

import path from 'path';
import { MarkdownRenderingOptions, renderMarkdownWithFrontmatter } from '@astrojs/markdown-support';

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
export async function convertMdToAstroSource(contents: string, { filename }: { filename: string }, opts?: MarkdownRenderingOptions): Promise<string> {
  let {
    content,
    frontmatter: { layout, ...frontmatter },
    ...data
  } = await renderMarkdownWithFrontmatter(contents, opts);

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
  const raw = await convertMdToAstroSource(contents, { filename }, compileOptions.astroConfig.markdownOptions);
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
/** Compiles an Astro component */
export async function compileComponent(source: string, { compileOptions, filename, projectRoot }: CompileComponentOptions): Promise<CompileResult> {
  const result = await transformFromSource(source, { compileOptions, filename, projectRoot });
  const { mode } = compileOptions;
  const { hostname, port } = compileOptions.astroConfig.devOptions;
  const devSite = `http://${hostname}:${port}`;
  const site = compileOptions.astroConfig.buildOptions.site || devSite;

  const fileID = path.join('/_astro', path.relative(projectRoot, filename));
  const fileURL = new URL('.' + fileID, mode === 'production' ? site : devSite);

  // return template
  let moduleJavaScript = `
import fetch from 'node-fetch';
${result.imports.join('\n')}

if(!('fetch' in globalThis)) {
  globalThis.fetch = fetch;
}

${/* Global Astro Namespace (shadowed & extended by the scoped namespace inside of __render()) */ ''}
const __TopLevelAstro = {
  site: new URL(${JSON.stringify(site)}),
  fetchContent: (globResult) => fetchContent(globResult, import.meta.url),
  resolve(...segments) {
    return segments.reduce(
      (url, segment) => new URL(segment, url),
      new URL(${JSON.stringify(fileURL)})
    ).pathname
  },
};
const Astro = __TopLevelAstro;

${
  result.hasCustomElements
    ? `
const __astro_element_registry = new AstroElementRegistry({
  candidates: new Map([${Array.from(result.customElementCandidates)
    .map(([identifier, url]) => `[${identifier}, '${url}']`)
    .join(', ')}])
});
`.trim()
    : ''
}

${result.getStaticPaths || ''}

// \`__render()\`: Render the contents of the Astro module.
import { h, Fragment } from 'astro/dist/internal/h.js';
const __astroInternal = Symbol('astro.internal');
const __astroContext = Symbol.for('astro.context');
async function __render(props, ...children) {
  const Astro = Object.create(__TopLevelAstro, {
    props: {
      value: props,
      enumerable: true
    },
    pageCSS: {
      value: (props[__astroContext] && props[__astroContext].pageCSS) || [],
      enumerable: true
    },
    isPage: {
      value: (props[__astroInternal] && props[__astroInternal].isPage) || false,
      enumerable: true
    },
    request: {
      value: (props[__astroContext] && props[__astroContext].request) || {},
      enumerable: true
    },
  });

  ${result.script}
  return h(Fragment, null, ${result.html});
}
export default { isAstroComponent: true, __render };

// \`__renderPage()\`: Render the contents of the Astro module as a page. This is a special flow,
// triggered by loading a component directly by URL.
export async function __renderPage({request, children, props, css}) {
  const currentChild = {
    isAstroComponent: true,
    layout: typeof __layout === 'undefined' ? undefined : __layout,
    content: typeof __content === 'undefined' ? undefined : __content,
    __render,
  };

  const isLayout = (__astroContext in props);
  if(!isLayout) {
    let astroRootUIDCounter = 0;
    Object.defineProperty(props, __astroContext, {
      value: {
        pageCSS: css,
        request,
        createAstroRootUID(seed) { return seed + astroRootUIDCounter++; },
      },
      writable: false,
      enumerable: false
    });
  }

  Object.defineProperty(props, __astroInternal, {
    value: {
      isPage: !isLayout
    },
    writable: false,
    enumerable: false
  });

  const childBodyResult = await currentChild.__render(props, children);

  // find layout, if one was given.
  if (currentChild.layout) {
    return currentChild.layout({
      request,
      props: {content: currentChild.content, [__astroContext]: props[__astroContext]},
      children: [childBodyResult],
    });
  }

  return childBodyResult;
};

${result.exports.join('\n')}

`;

  return {
    result,
    contents: moduleJavaScript,
    css: result.css,
  };
}
