import type { CompileOptions } from '../@types/compiler';
import type { AstroConfig, ValidExtensionPlugins } from '../@types/astro';
import type { Ast, Script, Style, TemplateNode } from '../parser/interfaces';
import type { JsxItem, TransformResult } from '../@types/astro';

import eslexer from 'es-module-lexer';
import esbuild from 'esbuild';
import path from 'path';
import { walk } from 'estree-walker';
import babelParser from '@babel/parser';
import _babelGenerator from '@babel/generator';
import { ImportDeclaration, ExportNamedDeclaration, VariableDeclarator, Identifier } from '@babel/types';

const babelGenerator: typeof _babelGenerator =
  // @ts-ignore
  _babelGenerator.default;
const { transformSync } = esbuild;

interface Attribute {
  start: number;
  end: number;
  type: 'Attribute';
  name: string;
  value: TemplateNode[] | boolean;
}

interface CodeGenOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}

/** Format Astro internal import URL */
function internalImport(internalPath: string) {
  return `/_astro_internal/${internalPath}`;
}

/** Retrieve attributes from TemplateNode */
function getAttributes(attrs: Attribute[]): Record<string, string> {
  let result: Record<string, string> = {};
  for (const attr of attrs) {
    if (attr.value === true) {
      result[attr.name] = JSON.stringify(attr.value);
      continue;
    }
    if (attr.value === false || attr.value === undefined) {
      // note: attr.value shouldn’t be `undefined`, but a bad transform would cause a compile error here, so prevent that
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
    const val = attr.value[0];
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
        throw new Error(`UNKNOWN: ${val.type}`);
    }
  }
  return result;
}

/** Get value from a TemplateNode Attribute (text attributes only!) */
function getTextFromAttribute(attr: any): string {
  if (attr.raw !== undefined) {
    return attr.raw;
  }
  if (attr.data !== undefined) {
    return attr.data;
  }
  throw new Error('UNKNOWN attr');
}

/** Convert TemplateNode attributes to string */
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
  plugin: string | undefined;
}

const defaultExtensions: Readonly<Record<string, ValidExtensionPlugins>> = {
  '.astro': 'astro',
  '.jsx': 'react',
  '.vue': 'vue',
  '.svelte': 'svelte',
};

type DynamicImportMap = Map<'vue' | 'react' | 'react-dom' | 'preact', string>;

interface GetComponentWrapperOptions {
  filename: string;
  astroConfig: AstroConfig;
  dynamicImports: DynamicImportMap;
}

/** Generate Astro-friendly component import */
function getComponentWrapper(_name: string, { type, plugin, url }: ComponentInfo, opts: GetComponentWrapperOptions) {
  const { astroConfig, dynamicImports, filename } = opts;
  const { astroRoot } = astroConfig;
  const [name, kind] = _name.split(':');
  const currFileUrl = new URL(`file://${filename}`);

  if (!plugin) {
    throw new Error(`No supported plugin found for extension ${type}`);
  }

  const getComponentUrl = (ext = '.js') => {
    const outUrl = new URL(url, currFileUrl);
    return '/_astro/' + path.posix.relative(astroRoot.pathname, outUrl.pathname).replace(/\.[^.]+$/, ext);
  };

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
      if (['load', 'idle', 'visible'].includes(kind)) {
        return {
          wrapper: `__preact_${kind}(${name}, ${JSON.stringify({
            componentUrl: getComponentUrl(),
            componentExport: 'default',
            frameworkUrls: {
              preact: dynamicImports.get('preact'),
            },
          })})`,
          wrapperImport: `import {__preact_${kind}} from '${internalImport('render/preact.js')}';`,
        };
      }

      return {
        wrapper: `__preact_static(${name})`,
        wrapperImport: `import {__preact_static} from '${internalImport('render/preact.js')}';`,
      };
    }
    case 'react': {
      if (['load', 'idle', 'visible'].includes(kind)) {
        return {
          wrapper: `__react_${kind}(${name}, ${JSON.stringify({
            componentUrl: getComponentUrl(),
            componentExport: 'default',
            frameworkUrls: {
              react: dynamicImports.get('react'),
              'react-dom': dynamicImports.get('react-dom'),
            },
          })})`,
          wrapperImport: `import {__react_${kind}} from '${internalImport('render/react.js')}';`,
        };
      }

      return {
        wrapper: `__react_static(${name})`,
        wrapperImport: `import {__react_static} from '${internalImport('render/react.js')}';`,
      };
    }
    case 'svelte': {
      if (['load', 'idle', 'visible'].includes(kind)) {
        return {
          wrapper: `__svelte_${kind}(${name}, ${JSON.stringify({
            componentUrl: getComponentUrl('.svelte.js'),
            componentExport: 'default',
          })})`,
          wrapperImport: `import {__svelte_${kind}} from '${internalImport('render/svelte.js')}';`,
        };
      }

      return {
        wrapper: `__svelte_static(${name})`,
        wrapperImport: `import {__svelte_static} from '${internalImport('render/svelte.js')}';`,
      };
    }
    case 'vue': {
      if (['load', 'idle', 'visible'].includes(kind)) {
        return {
          wrapper: `__vue_${kind}(${name}, ${JSON.stringify({
            componentUrl: getComponentUrl('.vue.js'),
            componentExport: 'default',
            frameworkUrls: {
              vue: dynamicImports.get('vue'),
            },
          })})`,
          wrapperImport: `import {__vue_${kind}} from '${internalImport('render/vue.js')}';`,
        };
      }

      return {
        wrapper: `__vue_static(${name})`,
        wrapperImport: `import {__vue_static} from '${internalImport('render/vue.js')}';`,
      };
    }
    default: {
      throw new Error(`Unknown component type`);
    }
  }
}

/** Evaluate mustache expression (safely) */
function compileExpressionSafe(raw: string): string {
  let { code } = transformSync(raw, {
    loader: 'tsx',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    charset: 'utf8',
  });
  return code;
}

/** Build dependency map of dynamic component runtime frameworks */
async function acquireDynamicComponentImports(plugins: Set<ValidExtensionPlugins>, resolve: (s: string) => Promise<string>): Promise<DynamicImportMap> {
  const importMap: DynamicImportMap = new Map();
  for (let plugin of plugins) {
    switch (plugin) {
      case 'vue': {
        importMap.set('vue', await resolve('vue'));
        break;
      }
      case 'react': {
        importMap.set('react', await resolve('react'));
        importMap.set('react-dom', await resolve('react-dom'));
        break;
      }
      case 'preact': {
        importMap.set('preact', await resolve('preact'));
        break;
      }
    }
  }
  return importMap;
}

type Components = Record<string, { type: string; url: string; plugin: string | undefined }>;

interface CodegenState {
  filename: string;
  components: Components;
  css: string[];
  importExportStatements: Set<string>;
  dynamicImports: DynamicImportMap;
}

function compileModule(module: Script, state: CodegenState, compileOptions: CompileOptions) {
  const { extensions = defaultExtensions } = compileOptions;

  const componentImports: ImportDeclaration[] = [];
  const componentProps: VariableDeclarator[] = [];
  const componentExports: ExportNamedDeclaration[] = [];

  let script = '';
  let propsStatement = '';
  const componentPlugins = new Set<ValidExtensionPlugins>();

  if (module) {
    const program = babelParser.parse(module.content, {
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
      const plugin = extensions[componentType] || defaultExtensions[componentType];
      state.components[componentName] = {
        type: componentType,
        plugin,
        url: importUrl,
      };
      if (plugin) {
        componentPlugins.add(plugin);
      }
      state.importExportStatements.add(module.content.slice(componentImport.start!, componentImport.end!));
    }
    for (const componentImport of componentExports) {
      state.importExportStatements.add(module.content.slice(componentImport.start!, componentImport.end!));
    }

    if (componentProps.length > 0) {
      propsStatement = 'let {';
      for (const componentExport of componentProps) {
        propsStatement += `${(componentExport.id as Identifier).name}`;
        if (componentExport.init) {
          propsStatement += `= ${babelGenerator(componentExport.init!).code}`;
        }
        propsStatement += `,`;
      }
      propsStatement += `} = props;`;
    }
    script = propsStatement + babelGenerator(program).code;
  }

  return { script, componentPlugins };
}

function compileCss(style: Style, state: CodegenState) {
  walk(style, {
    enter(node: TemplateNode) {
      if (node.type === 'Style') {
        state.css.push(node.content.styles); // if multiple <style> tags, combine together
        this.skip();
      }
    },
    leave(node: TemplateNode) {
      if (node.type === 'Style') {
        this.remove(); // this will be optimized in a global CSS file; remove so it‘s not accidentally inlined
      }
    },
  });
}

function compileHtml(enterNode: TemplateNode, state: CodegenState, compileOptions: CompileOptions) {
  const { components, css, importExportStatements, dynamicImports, filename } = state;
  const { astroConfig } = compileOptions;

  let outSource = '';
  walk(enterNode, {
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
          for (const astroComponent of matches.reverse()) {
            const name = astroComponent[1];
            const [componentName, componentKind] = name.split(':');
            if (!components[componentName]) {
              throw new Error(`Unknown Component: ${componentName}`);
            }
            const { wrapper, wrapperImport } = getComponentWrapper(name, components[componentName], { astroConfig, dynamicImports, filename });
            if (wrapperImport) {
              importExportStatements.add(wrapperImport);
            }
            if (wrapper !== name) {
              code = code.slice(0, astroComponent.index + 2) + wrapper + code.slice(astroComponent.index + astroComponent[0].length - 1);
            }
          }
          outSource += `,(${code.trim().replace(/\;$/, '')})`;
          this.skip();
          return;
        case 'Comment':
          return;
        case 'Fragment':
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

          outSource += outSource === '' ? '' : ',';
          if (node.type === 'Slot') {
            outSource += `(children`;
            return;
          }
          const COMPONENT_NAME_SCANNER = /^[A-Z]/;
          if (!COMPONENT_NAME_SCANNER.test(name)) {
            outSource += `h("${name}", ${attributes ? generateAttributes(attributes) : 'null'}`;
            return;
          }
          const [componentName, componentKind] = name.split(':');
          const componentImportData = components[componentName];
          if (!componentImportData) {
            throw new Error(`Unknown Component: ${componentName}`);
          }
          const { wrapper, wrapperImport } = getComponentWrapper(name, components[componentName], { astroConfig, dynamicImports, filename });
          if (wrapperImport) {
            importExportStatements.add(wrapperImport);
          }

          outSource += `h(${wrapper}, ${attributes ? generateAttributes(attributes) : 'null'}`;
          return;
        }
        case 'Attribute': {
          this.skip();
          return;
        }
        case 'Style': {
          css.push(node.content.styles); // if multiple <style> tags, combine together
          this.skip();
          return;
        }
        case 'Text': {
          const text = getTextFromAttribute(node);
          if (!text.trim()) {
            return;
          }
          outSource += ',' + JSON.stringify(text);
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
          return;
        case 'Slot':
        case 'Head':
        case 'Body':
        case 'Title':
        case 'Element':
        case 'InlineComponent':
          outSource += ')';
          return;
        case 'Style': {
          this.remove(); // this will be optimized in a global CSS file; remove so it‘s not accidentally inlined
          return;
        }
        default:
          throw new Error('Unexpected (leave) node type: ' + node.type);
      }
    },
  });

  return outSource;
}

/**
 * Codegen
 * Step 3/3 in Astro SSR.
 * This is the final pass over a document AST before it‘s converted to an h() function
 * and handed off to Snowpack to build.
 * @param {Ast} AST The parsed AST to crawl
 * @param {object} CodeGenOptions
 */
export async function codegen(ast: Ast, { compileOptions, filename }: CodeGenOptions): Promise<TransformResult> {
  await eslexer.init;

  const state: CodegenState = {
    filename,
    components: {},
    css: [],
    importExportStatements: new Set(),
    dynamicImports: new Map(),
  };

  const { script, componentPlugins } = compileModule(ast.module, state, compileOptions);
  state.dynamicImports = await acquireDynamicComponentImports(componentPlugins, compileOptions.resolve);

  compileCss(ast.css, state);

  const html = compileHtml(ast.html, state, compileOptions);

  return {
    script: script,
    imports: Array.from(state.importExportStatements),
    html,
    css: state.css.length ? state.css.join('\n\n') : undefined,
  };
}
