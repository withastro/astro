import type { LogOptions } from './logger.js';

import path from 'path';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { CompileResult, TransformResult } from './@types/astro';
import { parse } from './compiler/index.js';
import markdownEncode from './markdown-encode.js';
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
  // This doesn't work.
  const { data: _frontmatterData, content } = matter(contents);
  const mdHtml = micromark(content, {
    extensions: [gfmSyntax()],
    htmlExtensions: [gfmHtml, markdownEncode],
  });

  const setupData = {
    title: _frontmatterData.title,
    description: _frontmatterData.description,
    layout: _frontmatterData.layout,
    content: {
      frontmatter: _frontmatterData,

      // This is an awful hack due to Svelte parser disliking script tags badly.
      source: content.replace(/<\/?script/g, '<SCRIPT'),
      html: mdHtml,
    },
    props: {
      ..._frontmatterData,
    },
  };

  return convertHmxToJsx(
    `<script hmx="setup">export function setup() {
      return ${JSON.stringify(setupData)};
  }</script><head></head><body>${mdHtml}</body>`,
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

export async function compilePage(
  source: string,
  { compileOptions = defaultCompileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<CompileResult> {
  const sourceJsx = await transformFromSource(source, { compileOptions, filename, projectRoot });

  const headItem = sourceJsx.items.find((item) => item.name === 'head');
  const bodyItem = sourceJsx.items.find((item) => item.name === 'body');
  const headItemJsx = !headItem ? 'null' : headItem.jsx.replace('"head"', 'isRoot ? "head" : Fragment');
  const bodyItemJsx = !bodyItem ? 'null' : bodyItem.jsx.replace('"head"', 'isRoot ? "body" : Fragment');

  const modJsx = `
${sourceJsx.script}

import { h, Fragment } from '${internalImport('h.js')}';
export function head({title, description, props}, child, isRoot) { return (${headItemJsx}); }
export function body({title, description, props}, child, isRoot) { return (${bodyItemJsx}); }
`.trim();

  return {
    contents: modJsx,
  };
}

export async function compileComponent(
  source: string,
  { compileOptions = defaultCompileOptions, filename, projectRoot }: { compileOptions: CompileOptions; filename: string; projectRoot: string }
): Promise<CompileResult> {
  const sourceJsx = await transformFromSource(source, { compileOptions, filename, projectRoot });
  const componentJsx = sourceJsx.items.find((item) => item.name === 'Component');
  if (!componentJsx) {
    throw new Error(`${filename} <Component> expected!`);
  }
  const modJsx = `
      import { h, Fragment } from '${internalImport('h.js')}';
      export default function(props) { return h(Fragment, null, ${componentJsx.jsx}); }
      `.trim();
  return {
    contents: modJsx,
  };
}
