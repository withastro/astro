import type { Ast, Script, Style, TemplateNode } from 'astro-parser';
import type { CompileOptions } from '../../@types/compiler';
import type { AstroConfig, TransformResult } from '../../@types/astro';

import 'source-map-support/register.js';
import eslexer from 'es-module-lexer';
import esbuild from 'esbuild';
import path from 'path';
import { pathToFileURL } from 'url';
import { walk } from 'estree-walker';
import _babelGenerator from '@babel/generator';
import babelParser from '@babel/parser';
import { codeFrameColumns } from '@babel/code-frame';
import * as babelTraverse from '@babel/traverse';
import { ImportDeclaration, ExportNamedDeclaration, VariableDeclarator, Identifier } from '@babel/types';
import { error, warn } from '../../logger.js';
import { fetchContent } from './content.js';
import { isFetchContent } from './utils.js';
import { yellow } from 'kleur/colors';
import { AstroRenderer, ComponentInfo as ComponentMeta } from '../../@types/renderer-new';

const traverse: typeof babelTraverse.default = (babelTraverse.default as any).default;

// @ts-ignore
const babelGenerator: typeof _babelGenerator = _babelGenerator.default;
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
      case 'MustacheTag': {
        // FIXME: this won't work when JSX element can appear in attributes (rare but possible).
        const codeChunks = val.expression.codeChunks[0];
        if (codeChunks) {
          result[attr.name] = '(' + codeChunks + ')';
        } else {
          throw new Error(`Parse error: ${attr.name}={}`); // if bad codeChunk, throw error
        }
        continue;
      }
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
  switch (attr.type) {
    case 'Text': {
      if (attr.raw !== undefined) {
        return attr.raw;
      }
      if (attr.data !== undefined) {
        return attr.data;
      }
      break;
    }
    case 'MustacheTag': {
      // FIXME: this won't work when JSX element can appear in attributes (rare but possible).
      return attr.expression.codeChunks[0];
    }
  }
  throw new Error(`Unknown attribute type ${attr.type}`);
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
  ext?: string;
  url: string;
  renderer?: AstroRenderer;
}

type DynamicImportMap = Map<string, string>;

interface GetComponentWrapperOptions {
  filename: string;
  astroConfig: AstroConfig;
  dynamicImports: DynamicImportMap;
}

interface ResolveComponentInfoOptions {
  astroConfig: AstroConfig;
}

const rendererCache = new Map<string, AstroRenderer>();

/** Resolves component info for a given file and contents  */
function resolveComponentRenderer(importUrl: string, componentInfo: ComponentMeta, { astroConfig }: ResolveComponentInfoOptions): AstroRenderer | undefined {
  if (rendererCache.has(importUrl)) return rendererCache.get(importUrl);

  for (const renderer of astroConfig.rendererPlugins) {
    const result = renderer.filter(importUrl, componentInfo);
    if (result) return renderer;
  }
}

const validLoadMethods = new Set(['load', 'idle', 'visible']);

// TODO: update this to new renderer interface
/** Generate Astro-friendly component import */
function getComponentMarkup(_name: string, { ext, renderer, url }: ComponentInfo, opts: GetComponentWrapperOptions) {
  const { dynamicImports } = opts;
  const [name, kind] = _name.split(':');

  if (!renderer) {
    throw new Error(`No supported plugin found for ${ext ? `extension ${ext}` : `${url} (try adding an extension)`}`);
  }

  if (ext === 'astro') {
    if (kind) {
      throw new Error(`Astro does not support :${kind}`);
    }
    return {
      wrapper: name,
      wrapperImport: ``,
    };
  }

  if (!kind) {
    // TODO: static
  }

  if (validLoadMethods.has(kind)) {
    // TODO: dynamic
    return {
      clientMarkup: renderer,
      wrapperImport: (renderer.client.dependencies ?? []).map(i => dynamicImports.get(i))
    }
  }

  throw new Error(`Unsupported load directive ":${kind}" for component "${name}" at "${opts.filename}"`);

  // switch (plugin) {
  //   case 'astro': {
  //   }
  //   case 'preact': {
  //     if (['load', 'idle', 'visible'].includes(kind)) {
  //       return {
  //         wrapper: `__preact_${kind}(${name}, ${JSON.stringify({
  //           componentUrl: url,
  //           componentExport: 'default',
  //           frameworkUrls: {
  //             preact: dynamicImports.get('preact'),
  //           },
  //         })})`,
  //         wrapperImport: `import {__preact_${kind}} from '${internalImport('render/preact.js')}';`,
  //       };
  //     }

  //     return {
  //       wrapper: `__preact_static(${name})`,
  //       wrapperImport: `import {__preact_static} from '${internalImport('render/preact.js')}';`,
  //     };
  //   }
  //   case 'react': {
  //     if (['load', 'idle', 'visible'].includes(kind)) {
  //       return {
  //         wrapper: `__react_${kind}(${name}, ${JSON.stringify({
  //           componentUrl: getComponentUrl(),
  //           componentExport: 'default',
  //           frameworkUrls: {
  //             react: dynamicImports.get('react'),
  //             'react-dom': dynamicImports.get('react-dom'),
  //           },
  //         })})`,
  //         wrapperImport: `import {__react_${kind}} from '${internalImport('render/react.js')}';`,
  //       };
  //     }

  //     return {
  //       wrapper: `__react_static(${name})`,
  //       wrapperImport: `import {__react_static} from '${internalImport('render/react.js')}';`,
  //     };
  //   }
  //   case 'svelte': {
  //     if (['load', 'idle', 'visible'].includes(kind)) {
  //       return {
  //         wrapper: `__svelte_${kind}(${name}, ${JSON.stringify({
  //           componentUrl: getComponentUrl('.svelte.js'),
  //           componentExport: 'default',
  //           frameworkUrls: {
  //             'svelte-runtime': internalImport('runtime/svelte.js'),
  //           },
  //         })})`,
  //         wrapperImport: `import {__svelte_${kind}} from '${internalImport('render/svelte.js')}';`,
  //       };
  //     }

  //     return {
  //       wrapper: `__svelte_static(${name})`,
  //       wrapperImport: `import {__svelte_static} from '${internalImport('render/svelte.js')}';`,
  //     };
  //   }
  //   case 'vue': {
  //     if (['load', 'idle', 'visible'].includes(kind)) {
  //       return {
  //         wrapper: `__vue_${kind}(${name}, ${JSON.stringify({
  //           componentUrl: getComponentUrl('.vue.js'),
  //           componentExport: 'default',
  //           frameworkUrls: {
  //             vue: dynamicImports.get('vue'),
  //           },
  //         })})`,
  //         wrapperImport: `import {__vue_${kind}} from '${internalImport('render/vue.js')}';`,
  //       };
  //     }

  //     return {
  //       wrapper: `__vue_static(${name})`,
  //       wrapperImport: `import {__vue_static} from '${internalImport('render/vue.js')}';`,
  //     };
  //   }
  //   default: {
  //     throw new Error(`Unknown component type`);
  //   }
  // }
}

/** Evaluate expression (safely) */
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
async function acquireDynamicComponentImports(renderers: Set<AstroRenderer>, resolvePackageUrl: (s: string) => Promise<string>): Promise<DynamicImportMap> {
  const importMap: DynamicImportMap = new Map();
  for (let renderer of renderers) {
    const dependencies = [renderer.jsx?.importSource, ...(renderer.client.dependencies, []), ...(renderer.server.dependencies, [])].filter((x) => x) as string[];
    const imports = await Promise.all(dependencies.map((dep) => resolvePackageUrl(dep).then((url) => [dep, url] as const)));
    for (let [spec, packageUrl] of imports) {
      importMap.set(spec, packageUrl);
    }
  }
  return importMap;
}

interface CompileResult {
  script: string;
  componentRenderers: Set<string>;
  createCollection?: string;
}

interface CodegenState {
  filename: string;
  components: Record<string, ComponentInfo>;
  css: string[];
  importExportStatements: Set<string>;
  dynamicImports: DynamicImportMap;
}

/** Compile/prepare Astro frontmatter scripts */
async function compileModule(module: Script, state: CodegenState, compileOptions: CompileOptions): Promise<CompileResult> {
  const { astroConfig, loadUrl } = compileOptions;

  const componentImports: ImportDeclaration[] = [];
  const componentProps: VariableDeclarator[] = [];
  const componentExports: ExportNamedDeclaration[] = [];

  const contentImports = new Map<string, { spec: string; declarator: string }>();

  let script = '';
  let propsStatement = '';
  let contentCode = ''; // code for handling Astro.fetchContent(), if any;
  let createCollection = ''; // function for executing collection
  const componentRenderers = new Set<string>();

  const { astroRoot } = astroConfig;
  const currFileUrl = new URL(`file://${state.filename}`);
  const getComponentUrl = (url: string, ext = '.js') => {
    const outUrl = new URL(url, currFileUrl);
    return '/_astro/' + path.posix.relative(astroRoot.pathname, outUrl.pathname).replace(/\.[^.]+$/, ext);
  };

  if (module) {
    const parseOptions: babelParser.ParserOptions = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'topLevelAwait'],
    };
    let parseResult;
    try {
      parseResult = babelParser.parse(module.content, parseOptions);
    } catch (err) {
      const location = { start: err.loc };
      const frame = codeFrameColumns(module.content, location);
      err.frame = frame;
      err.filename = state.filename;
      err.start = err.loc;
      throw err;
    }
    const program = parseResult.program;

    const { body } = program;
    let i = body.length;
    while (--i >= 0) {
      const node = body[i];
      switch (node.type) {
        case 'ExportNamedDeclaration': {
          if (!node.declaration) break;
          // const replacement = extract_exports(node);

          if (node.declaration.type === 'VariableDeclaration') {
            // case 1: prop (export let title)

            const declaration = node.declaration.declarations[0];
            if ((declaration.id as Identifier).name === '__layout' || (declaration.id as Identifier).name === '__content') {
              componentExports.push(node);
            } else {
              componentProps.push(declaration);
            }
            body.splice(i, 1);
          } else if (node.declaration.type === 'FunctionDeclaration') {
            // case 2: createCollection (export async function)
            if (!node.declaration.id || node.declaration.id.name !== 'createCollection') break;
            createCollection = module.content.substring(node.declaration.start || 0, node.declaration.end || 0);

            // remove node
            body.splice(i, 1);
          }
          break;
        }
        case 'FunctionDeclaration': {
          break;
        }
        case 'ImportDeclaration': {
          componentImports.push(node);
          body.splice(i, 1); // remove node
          break;
        }
        case 'VariableDeclaration': {
          for (const declaration of node.declarations) {
            // only select Astro.fetchContent() calls here. this utility filters those out for us.
            if (!isFetchContent(declaration)) continue;

            // remove node
            body.splice(i, 1);

            // a bit of munging
            let { id, init } = declaration;
            if (!id || !init || id.type !== 'Identifier') continue;
            if (init.type === 'AwaitExpression') {
              init = init.argument;
              const shortname = path.posix.relative(compileOptions.astroConfig.projectRoot.pathname, state.filename);
              warn(compileOptions.logging, shortname, yellow('awaiting Astro.fetchContent() not necessary'));
            }
            if (init.type !== 'CallExpression') continue;

            // gather data
            const namespace = id.name;

            if ((init as any).arguments[0].type !== 'StringLiteral') {
              throw new Error(`[Astro.fetchContent] Only string literals allowed, ex: \`Astro.fetchContent('./post/*.md')\`\n  ${state.filename}`);
            }
            const spec = (init as any).arguments[0].value;
            if (typeof spec === 'string') contentImports.set(namespace, { spec, declarator: node.kind });
          }
          break;
        }
      }
    }

    for (const componentImport of componentImports) {
      const rawImportUrl = componentImport.source.value;
      const importExt = path.posix.extname(rawImportUrl);
      const specifier = componentImport.specifiers[0];
      if (!specifier) continue; // this is unused
      // set componentName to default import if used (user), or use filename if no default import (mostly internal use)
      const localComponentName = specifier.local.name;

      const importUrl = getComponentUrl(rawImportUrl, importExt);
      const res = await loadUrl(importUrl);
      if (!res) throw new Error(`Unable to resolve "${importUrl}"`);

      const rendererInfo = resolveComponentRenderer(res.originalFileLoc ?? importUrl, { imports: res.imports, contents: res.contents.toString() }, { astroConfig });
      if (rendererInfo) {
        componentRenderers.add(rendererInfo.id);
      }
      state.components[localComponentName] = {
        ...(rendererInfo ?? {}),
        ext: importExt,
        url: importUrl,
      };
      const { start, end } = componentImport;
      state.importExportStatements.add(module.content.slice(start || undefined, end || undefined));
    }
    for (const componentImport of componentExports) {
      const { start, end } = componentImport;
      state.importExportStatements.add(module.content.slice(start || undefined, end || undefined));
    }

    if (componentProps.length > 0) {
      propsStatement = 'let {';
      for (const componentExport of componentProps) {
        propsStatement += `${(componentExport.id as Identifier).name}`;
        const { init } = componentExport;
        if (init) {
          propsStatement += `= ${babelGenerator(init).code}`;
        }
        propsStatement += `,`;
      }
      propsStatement += `} = props;\n`;
    }

    // handle createCollection, if any
    if (createCollection) {
      const ast = babelParser.parse(createCollection, {
        sourceType: 'module',
      });
      traverse(ast, {
        enter({ node }) {
          switch (node.type) {
            case 'VariableDeclaration': {
              for (const declaration of node.declarations) {
                // only select Astro.fetchContent() calls here. this utility filters those out for us.
                if (!isFetchContent(declaration)) continue;

                // a bit of munging
                let { id, init } = declaration;
                if (!id || !init || id.type !== 'Identifier') continue;
                if (init.type === 'AwaitExpression') {
                  init = init.argument;
                  const shortname = path.relative(compileOptions.astroConfig.projectRoot.pathname, state.filename);
                  warn(compileOptions.logging, shortname, yellow('awaiting Astro.fetchContent() not necessary'));
                }
                if (init.type !== 'CallExpression') continue;

                // gather data
                const namespace = id.name;

                if ((init as any).arguments[0].type !== 'StringLiteral') {
                  throw new Error(`[Astro.fetchContent] Only string literals allowed, ex: \`Astro.fetchContent('./post/*.md')\`\n  ${state.filename}`);
                }
                const spec = (init as any).arguments[0].value;
                if (typeof spec !== 'string') break;

                const globResult = fetchContent(spec, { namespace, filename: state.filename });

                let imports = '';
                for (const importStatement of globResult.imports) {
                  imports += importStatement + '\n';
                }

                createCollection =
                  imports + '\nexport ' + createCollection.substring(0, declaration.start || 0) + globResult.code + createCollection.substring(declaration.end || 0);
              }
              break;
            }
          }
        },
      });
    }

    // Astro.fetchContent()
    for (const [namespace, { spec }] of contentImports.entries()) {
      const globResult = fetchContent(spec, { namespace, filename: state.filename });
      for (const importStatement of globResult.imports) {
        state.importExportStatements.add(importStatement);
      }
      contentCode += globResult.code;
    }

    script = propsStatement + contentCode + babelGenerator(program).code;
  }

  return {
    script,
    componentRenderers,
    createCollection: createCollection || undefined,
  };
}

/** Compile styles */
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

/** Compile page markup */
function compileHtml(enterNode: TemplateNode, state: CodegenState, compileOptions: CompileOptions) {
  const { components, css, importExportStatements, dynamicImports, filename } = state;
  const { astroConfig } = compileOptions;

  let outSource = '';
  walk(enterNode, {
    enter(node: TemplateNode) {
      switch (node.type) {
        case 'Expression': {
          let children: string[] = [];
          for (const child of node.children || []) {
            children.push(compileHtml(child, state, compileOptions));
          }
          let raw = '';
          let nextChildIndex = 0;
          for (const chunk of node.codeChunks) {
            raw += chunk;
            if (nextChildIndex < children.length) {
              raw += children[nextChildIndex++];
            }
          }
          // TODO Do we need to compile this now, or should we compile the entire module at the end?
          let code = compileExpressionSafe(raw).trim().replace(/\;$/, '');
          outSource += `,(${code})`;
          this.skip();
          break;
        }
        case 'MustacheTag':
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
          try {
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
          } catch (err) {
            // handle errors in scope with filename
            const rel = filename.replace(astroConfig.projectRoot.pathname, '');
            // TODO: return actual codeframe here
            error(compileOptions.logging, rel, err.toString());
          }
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
        case 'Attribute':
        case 'Comment':
        case 'Fragment':
        case 'Expression':
        case 'MustacheTag':
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

  const { script, componentRenderers, createCollection } = await compileModule(ast.module, state, compileOptions);
  state.dynamicImports = await acquireDynamicComponentImports(componentRenderers, compileOptions.resolvePackageUrl);

  compileCss(ast.css, state);

  const html = compileHtml(ast.html, state, compileOptions);

  return {
    script: script,
    imports: Array.from(state.importExportStatements),
    html,
    css: state.css.length ? state.css.join('\n\n') : undefined,
    createCollection,
  };
}
