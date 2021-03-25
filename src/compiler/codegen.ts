import type { CompileOptions } from '../@types/compiler';
import type { ValidExtensionPlugins } from '../@types/astro';
import type { Ast, TemplateNode } from '../parser/interfaces';
import type { JsxItem, TransformResult } from '../@types/astro';

import eslexer from 'es-module-lexer';
import esbuild from 'esbuild';
import path from 'path';
import { walk } from 'estree-walker';
import babelParser from '@babel/parser';
import _babelGenerator from '@babel/generator';
import traverse from '@babel/traverse';
import { ImportDeclaration,ExportNamedDeclaration,  VariableDeclarator, Identifier, VariableDeclaration } from '@babel/types';

const babelGenerator: typeof _babelGenerator =
  // @ts-ignore
  _babelGenerator.default;
const { transformSync } = esbuild;

interface Attribute {
  start: number;
  end: number;
  type: 'Attribute';
  name: string;
  value: any;
}

interface CodeGenOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}

function internalImport(internalPath: string) {
  return `/_astro_internal/${internalPath}`;
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
            if (v.content) {
              return v.content;
            } else {
              return JSON.stringify(getTextFromAttribute(v));
            }
          })
          .join('+') +
        ')';
      continue;
    }
    const val: TemplateNode = attr.value[0];
    if (!val) {
      result[attr.name] = '(' + val + ')';
      continue;
    }
    switch (val.type) {
      case 'MustacheTag':
        result[attr.name] = '(' + val.content + ')';
        continue;
      case 'Text':
        result[attr.name] = JSON.stringify(getTextFromAttribute(val));
        continue;
      default:
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
  throw new Error('UNKNOWN attr');
}

function generateAttributes(attrs: Record<string, string>): string {
  let result = '{';
  for (const [key, val] of Object.entries(attrs)) {
    result += JSON.stringify(key) + ':' + val + ',';
  }
  return result + '}';
}

interface ComponentInfo {
  type: string;
  url: string;
}

const defaultExtensions: Readonly<Record<string, ValidExtensionPlugins>> = {
  '.astro': 'astro',
  '.jsx': 'react',
  '.vue': 'vue',
  '.svelte': 'svelte',
};

function getComponentWrapper(_name: string, { type, url }: ComponentInfo, compileOptions: CompileOptions) {
  const { resolve, extensions = defaultExtensions } = compileOptions;

  const [name, kind] = _name.split(':');

  const plugin = extensions[type] || defaultExtensions[type];

  if (!plugin) {
    throw new Error(`No supported plugin found for extension ${type}`);
  }

  switch (plugin) {
    case 'astro': {
      if (kind) {
        throw new Error(`Astro does not support :${kind}`);
      }
      return {
        wrapper: name,
        wrapperImport: ``,
      };
    }
    case 'preact': {
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
    case 'react': {
      if (kind === 'dynamic') {
        return {
          wrapper: `__react_dynamic(${name}, new URL(${JSON.stringify(url.replace(/\.[^.]+$/, '.js'))}, \`http://TEST\${import.meta.url}\`).pathname, '${resolve(
            'react'
          )}', '${resolve('react-dom')}')`,
          wrapperImport: `import {__react_dynamic} from '${internalImport('render/react.js')}';`,
        };
      } else {
        return {
          wrapper: `__react_static(${name})`,
          wrapperImport: `import {__react_static} from '${internalImport('render/react.js')}';`,
        };
      }
    }
    case 'svelte': {
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
    case 'vue': {
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

function compileScriptSafe(raw: string): string {
  let compiledCode = compileExpressionSafe(raw);
  // esbuild treeshakes unused imports. In our case these are components, so let's keep them.
  const imports = eslexer
    .parse(raw)[0]
    .filter(({ d }) => d === -1)
    .map((i) => raw.substring(i.ss, i.se));
  for (let importStatement of imports) {
    if (!compiledCode.includes(importStatement)) {
      compiledCode = importStatement + '\n' + compiledCode;
    }
  }
  return compiledCode;
}

function compileExpressionSafe(raw: string): string {
  let { code } = transformSync(raw, {
    loader: 'tsx',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    charset: 'utf8',
  });
  return code;
}

export async function codegen(ast: Ast, { compileOptions }: CodeGenOptions): Promise<TransformResult> {
  await eslexer.init;

  const componentImports: ImportDeclaration[] = [];
  const componentProps: VariableDeclarator[] = [];
  const componentExports: ExportNamedDeclaration[] = [];

  let script = '';
  let propsStatement: string = '';
  const importExportStatements: Set<string> = new Set();
  const components: Record<string, { type: string; url: string }> = {};

  if (ast.module) {
    const program = babelParser.parse(ast.module.content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'topLevelAwait'],
    }).program;

    const { body } = program;
    let i = body.length;
    while (--i >= 0) {
      const node = body[i];
      if (node.type === 'ImportDeclaration') {
        componentImports.push(node);
        body.splice(i, 1);
      }
      if (/^Export/.test(node.type)) {
        if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
          const declaration = node.declaration.declarations[0];
          if ((declaration.id as Identifier).name === '__layout' || (declaration.id as Identifier).name === '__content') {
          componentExports.push(node);
          } else {
            componentProps.push(declaration);
          }
          body.splice(i, 1);
        }
        // const replacement = extract_exports(node);
      }
    }

    for (const componentImport of componentImports) {
      const importUrl = componentImport.source.value;
      const componentType = path.posix.extname(importUrl);
      const componentName = path.posix.basename(importUrl, componentType);
      components[componentName] = { type: componentType, url: importUrl };
      importExportStatements.add(ast.module.content.slice(componentImport.start!, componentImport.end!));
    }
    for (const componentImport of componentExports) {
      importExportStatements.add(ast.module.content.slice(componentImport.start!, componentImport.end!));
    }

    if (componentProps.length > 0) {
      propsStatement = 'let {';
      for (const componentExport of componentProps) {
        propsStatement += `${(componentExport.id as Identifier).name}`;
        if (componentExport.init) {
        propsStatement += `= ${babelGenerator(componentExport.init!).code }`;
        }
        propsStatement += `,`;
      }
      propsStatement += `} = props;`;
    }
    script = propsStatement + babelGenerator(program).code;
  }

  let items: JsxItem[] = [];
  let collectionItem: JsxItem | undefined;
  let currentItemName: string | undefined;
  let currentDepth = 0;

  walk(ast.html, {
    enter(node: TemplateNode) {
      switch (node.type) {
        case 'MustacheTag':
          let code = compileExpressionSafe(node.content);

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
              importExportStatements.add(wrapperImport);
            }
            if (wrapper !== name) {
              code = code.slice(0, match.index + 2) + wrapper + code.slice(match.index + match[0].length - 1);
            }
          }
          collectionItem!.jsx += `,(${code.trim().replace(/\;$/, '')})`;
          this.skip();
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

        case 'Slot':
        case 'Head':
        case 'InlineComponent':
        case 'Title':
        case 'Element': {
          const name: string = node.name;
          if (!name) {
            throw new Error('AHHHH');
          }
          const attributes = getAttributes(node.attributes);
          currentDepth++;
          currentItemName = name;
          if (!collectionItem) {
            collectionItem = { name, jsx: '' };
            items.push(collectionItem);
          }
          collectionItem.jsx += collectionItem.jsx === '' ? '' : ',';
          if (node.type === 'Slot') {
            collectionItem.jsx += `(children`;
            return;
          }
          const COMPONENT_NAME_SCANNER = /^[A-Z]/;
          if (!COMPONENT_NAME_SCANNER.test(name)) {
            collectionItem.jsx += `h("${name}", ${attributes ? generateAttributes(attributes) : 'null'}`;
            return;
          }
          const [componentName, componentKind] = name.split(':');
          const componentImportData = components[componentName];
          if (!componentImportData) {
            throw new Error(`Unknown Component: ${componentName}`);
          }
          const { wrapper, wrapperImport } = getComponentWrapper(name, components[componentName], compileOptions);
          if (wrapperImport) {
            importExportStatements.add(wrapperImport);
          }

          collectionItem.jsx += `h(${wrapper}, ${attributes ? generateAttributes(attributes) : 'null'}`;
          return;
        }
        case 'Attribute': {
          this.skip();
          return;
        }
        case 'Style': {
          const attributes = getAttributes(node.attributes);
          items.push({ name: 'style', jsx: `h("style", ${attributes ? generateAttributes(attributes) : 'null'}, ${JSON.stringify(node.content.styles)})` });
          break;
        }
        case 'Text': {
          const text = getTextFromAttribute(node);
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
          throw new Error('Unexpected (enter) node type: ' + node.type);
      }
    },
    leave(node, parent, prop, index) {
      switch (node.type) {
        case 'Text':
        case 'MustacheTag':
        case 'Attribute':
        case 'Comment':
          return;
        case 'Fragment':
          if (!collectionItem) {
            return;
          }
        case 'Slot':
        case 'Head':
        case 'Body':
        case 'Title':
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
        case 'Style': {
          return;
        }
        default:
          throw new Error('Unexpected (leave) node type: ' + node.type);
      }
    },
  });

  return {
    script: script,
    imports: Array.from(importExportStatements),
    items,
  };
}
