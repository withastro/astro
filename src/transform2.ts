import type { LogOptions } from './logger.js';

import path from 'path';
import esbuild from 'esbuild';
import eslexer from 'es-module-lexer';
import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { walk } from 'estree-walker';
import { parse } from './compiler/index.js';
import markdownEncode from './markdown-encode.js';
import { TemplateNode } from './compiler/interfaces.js';
import { defaultLogOptions, info } from './logger.js';
import { transformStyle } from './style.js';
import { JsxItem } from './@types/astro.js';

const { transformSync } = esbuild;

interface Attribute {
  start: 574;
  end: 595;
  type: 'Attribute';
  name: 'class';
  value: any;
}

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

function getAttributes(attrs: Attribute[]): Record<string, string> {
  let result: Record<string, string> = {};
  for (const attr of attrs) {
    if (attr.value === true) {
      result[attr.name] = JSON.stringify(attr.value);
      continue;
    }
    if (attr.value === false) {
      continue;
    }
    if (attr.value.length > 1) {
      result[attr.name] =
        '(' +
        attr.value
          .map((v: TemplateNode) => {
            if (v.expression) {
              return v.expression;
            } else {
              return JSON.stringify(getTextFromAttribute(v));
            }
          })
          .join('+') +
        ')';
      continue;
    }
    const val: TemplateNode = attr.value[0];
    switch (val.type) {
      case 'MustacheTag':
        result[attr.name] = '(' + val.expression + ')';
        continue;
      case 'Text':
        result[attr.name] = JSON.stringify(getTextFromAttribute(val));
        continue;
      default:
        console.log(val);
        throw new Error('UNKNOWN V');
    }
  }
  return result;
}

function getTextFromAttribute(attr: any): string {
  if (attr.raw !== undefined) {
    return attr.raw;
  }
  if (attr.data !== undefined) {
    return attr.data;
  }
  console.log(attr);
  throw new Error('UNKNOWN attr');
}

function generateAttributes(attrs: Record<string, string>): string {
  let result = '{';
  for (const [key, val] of Object.entries(attrs)) {
    result += JSON.stringify(key) + ':' + val + ',';
  }
  return result + '}';
}

function getComponentWrapper(_name: string, { type, url }: { type: string; url: string }, { resolve }: CompileOptions) {
  const [name, kind] = _name.split(':');
  switch (type) {
    case '.hmx': {
      if (kind) {
        throw new Error(`HMX does not support :${kind}`);
      }
      return {
        wrapper: name,
        wrapperImport: ``,
      };
    }
    case '.jsx': {
      if (kind === 'dynamic') {
        return {
          wrapper: `__preact_dynamic(${name}, new URL(${JSON.stringify(url.replace(/\.[^.]+$/, '.js'))}, \`http://TEST\${import.meta.url}\`).pathname, '${resolve('preact')}')`,
          wrapperImport: `import {__preact_dynamic} from '${internalImport('render/preact.js')}';`,
        };
      } else {
        return {
          wrapper: `__preact_static(${name})`,
          wrapperImport: `import {__preact_static} from '${internalImport('render/preact.js')}';`,
        };
      }
    }
    case '.svelte': {
      if (kind === 'dynamic') {
        return {
          wrapper: `__svelte_dynamic(${name}, new URL(${JSON.stringify(url.replace(/\.[^.]+$/, '.svelte.js'))}, \`http://TEST\${import.meta.url}\`).pathname)`,
          wrapperImport: `import {__svelte_dynamic} from '${internalImport('render/svelte.js')}';`,
        };
      } else {
        return {
          wrapper: `__svelte_static(${name})`,
          wrapperImport: `import {__svelte_static} from '${internalImport('render/svelte.js')}';`,
        };
      }
    }
    case '.vue': {
      if (kind === 'dynamic') {
        return {
          wrapper: `__vue_dynamic(${name}, new URL(${JSON.stringify(url.replace(/\.[^.]+$/, '.vue.js'))}, \`http://TEST\${import.meta.url}\`).pathname, '${resolve('vue')}')`,
          wrapperImport: `import {__vue_dynamic} from '${internalImport('render/vue.js')}';`,
        };
      } else {
        return {
          wrapper: `__vue_static(${name})`,
          wrapperImport: `
            import {__vue_static} from '${internalImport('render/vue.js')}';
          `,
        };
      }
    }
  }
  throw new Error('Unknown Component Type: ' + name);
}

const patternImport = new RegExp(/import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*[@\w_-]+)["'\s].*;$/, 'mg');
function compileScriptSafe(raw: string, loader: 'jsx' | 'tsx'): string {
  // esbuild treeshakes unused imports. In our case these are components, so let's keep them.
  const imports: Array<string> = [];
  raw.replace(patternImport, (value: string) => {
    imports.push(value);
    return value;
  });

  let { code } = transformSync(raw, {
    loader,
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    charset: 'utf8',
  });

  for (let importStatement of imports) {
    if (!code.includes(importStatement)) {
      code = importStatement + '\n' + code;
    }
  }

  return code;
}

async function convertHmxToJsx(template: string, { compileOptions, filename, fileID }: { compileOptions: CompileOptions; filename: string; fileID: string }) {
  await eslexer.init;

  const ast = parse(template, {
    filename,
  });
  const script = compileScriptSafe(ast.instance ? ast.instance.content : '', 'tsx');

  // Compile scripts as TypeScript, always

  // Todo: Validate that `h` and `Fragment` aren't defined in the script

  const [scriptImports] = eslexer.parse(script, 'optional-sourcename');
  const components = Object.fromEntries(
    scriptImports.map((imp) => {
      const componentType = path.posix.extname(imp.n!);
      const componentName = path.posix.basename(imp.n!, componentType);
      return [componentName, { type: componentType, url: imp.n! }];
    })
  );

  const additionalImports = new Set<string>();
  let items: JsxItem[] = [];
  let mode: 'JSX' | 'SCRIPT' | 'SLOT' = 'JSX';
  let collectionItem: JsxItem | undefined;
  let currentItemName: string | undefined;
  let currentDepth = 0;
  const classNames: Set<string> = new Set();

  walk(ast.html, {
    enter(node, parent, prop, index) {
      //   console.log("enter", node.type);
      switch (node.type) {
        case 'MustacheTag':
          let code = compileScriptSafe(node.expression, 'jsx');

          let matches: RegExpExecArray[] = [];
          let match: RegExpExecArray | null | undefined;
          const H_COMPONENT_SCANNER = /h\(['"]?([A-Z].*?)['"]?,/gs;
          const regex = new RegExp(H_COMPONENT_SCANNER);
          while ((match = regex.exec(code))) {
            matches.push(match);
          }
          for (const match of matches.reverse()) {
            const name = match[1];
            const [componentName, componentKind] = name.split(':');
            if (!components[componentName]) {
              throw new Error(`Unknown Component: ${componentName}`);
            }
            const { wrapper, wrapperImport } = getComponentWrapper(name, components[componentName], compileOptions);
            if (wrapperImport) {
              additionalImports.add(wrapperImport);
            }
            if (wrapper !== name) {
              code = code.slice(0, match.index + 2) + wrapper + code.slice(match.index + match[0].length - 1);
            }
          }
          collectionItem!.jsx += `,(${code.trim().replace(/\;$/, '')})`;
          return;
        case 'Slot':
          mode = 'SLOT';
          collectionItem!.jsx += `,child`;
          return;
        case 'Comment':
          return;
        case 'Fragment':
          // Ignore if its the top level fragment
          // This should be cleaned up, but right now this is how the old thing worked
          if (!collectionItem) {
            return;
          }
          break;
        case 'InlineComponent':
        case 'Element':
          const name: string = node.name;
          if (!name) {
            console.log(node);
            throw new Error('AHHHH');
          }
          const attributes = getAttributes(node.attributes);
          currentDepth++;
          currentItemName = name;
          if (!collectionItem) {
            collectionItem = { name, jsx: '' };
            items.push(collectionItem);
          }
          if (attributes.class) {
            attributes.class
              .replace(/^"/, '')
              .replace(/"$/, '')
              .split(' ')
              .map((c) => c.trim())
              .forEach((c) => classNames.add(c));
          }
          collectionItem.jsx += collectionItem.jsx === '' ? '' : ',';
          const COMPONENT_NAME_SCANNER = /^[A-Z]/;
          if (!COMPONENT_NAME_SCANNER.test(name)) {
            collectionItem.jsx += `h("${name}", ${attributes ? generateAttributes(attributes) : 'null'}`;
            return;
          }
          if (name === 'Component') {
            collectionItem.jsx += `h(Fragment, null`;
            return;
          }
          const [componentName, componentKind] = name.split(':');
          const componentImportData = components[componentName];
          if (!componentImportData) {
            throw new Error(`Unknown Component: ${componentName}`);
          }
          const { wrapper, wrapperImport } = getComponentWrapper(name, components[componentName], compileOptions);
          if (wrapperImport) {
            additionalImports.add(wrapperImport);
          }

          collectionItem.jsx += `h(${wrapper}, ${attributes ? generateAttributes(attributes) : 'null'}`;
          return;
        case 'Attribute': {
          this.skip();
          return;
        }
        case 'Text': {
          const text = getTextFromAttribute(node);
          if (mode === 'SLOT') {
            return;
          }
          if (!text.trim()) {
            return;
          }
          if (!collectionItem) {
            throw new Error('Not possible! TEXT:' + text);
          }
          if (currentItemName === 'script' || currentItemName === 'code') {
            collectionItem.jsx += ',' + JSON.stringify(text);
            return;
          }
          collectionItem.jsx += ',' + JSON.stringify(text);
          return;
        }
        default:
          console.log(node);
          throw new Error('Unexpected node type: ' + node.type);
      }
    },
    leave(node, parent, prop, index) {
      //   console.log("leave", node.type);
      switch (node.type) {
        case 'Text':
        case 'MustacheTag':
        case 'Attribute':
        case 'Comment':
          return;
        case 'Slot': {
          const name = node.name;
          if (name === 'slot') {
            mode = 'JSX';
          }
          return;
        }
        case 'Fragment':
          if (!collectionItem) {
            return;
          }
        case 'Element':
        case 'InlineComponent':
          if (!collectionItem) {
            throw new Error('Not possible! CLOSE ' + node.name);
          }
          collectionItem.jsx += ')';
          currentDepth--;
          if (currentDepth === 0) {
            collectionItem = undefined;
          }
          return;
        default:
          throw new Error('Unexpected node type: ' + node.type);
      }
    },
  });

  let stylesPromises: any[] = [];
  walk(ast.css, {
    enter(node) {
      if (node.type !== 'Style') return;

      const code = node.content.styles;
      const typeAttr = node.attributes && node.attributes.find(({ name }) => name === 'type');
      stylesPromises.push(
        transformStyle(code, {
          type: (typeAttr.value[0] && typeAttr.value[0].raw) || undefined,
          classNames,
          filename,
          fileID,
        })
      ); // TODO: styles needs to go in <head>
    },
  });
  const styles = await Promise.all(stylesPromises); // TODO: clean this up
  console.log({ styles });

  // console.log({
  //   additionalImports,
  //   script,
  //   items,
  // });

  return {
    script: script + '\n' + Array.from(additionalImports).join('\n'),
    items,
  };
}

async function convertMdToJsx(contents: string, { compileOptions, filename, fileID }: { compileOptions: CompileOptions; filename: string; fileID: string }) {
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
): Promise<ReturnType<typeof convertHmxToJsx>> {
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
) {
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
) {
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
