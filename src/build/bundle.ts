import type { AstroConfig, RuntimeMode, ValidExtensionPlugins } from '../@types/astro';
import type { ImportDeclaration } from '@babel/types';
import type { InputOptions, OutputOptions } from 'rollup';
import type { AstroRuntime } from '../runtime';
import type { LogOptions } from '../logger';

import esbuild from 'esbuild';
import { promises as fsPromises } from 'fs';
import { parse } from '../parser/index.js';
import { transform } from '../compiler/transform/index.js';
import { convertMdToAstroSource } from '../compiler/index.js';
import { getAttrValue } from '../ast.js';
import { walk } from 'estree-walker';
import babelParser from '@babel/parser';
import path from 'path';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';

const { transformSync } = esbuild;
const { readFile } = fsPromises;

type DynamicImportMap = Map<'vue' | 'react' | 'react-dom' | 'preact', string>;

/** Add framework runtimes when needed */
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

const defaultExtensions: Readonly<Record<string, ValidExtensionPlugins>> = {
  '.jsx': 'react',
  '.svelte': 'svelte',
  '.vue': 'vue',
};

interface CollectDynamic {
  astroConfig: AstroConfig;
  resolve: (s: string) => Promise<string>;
  logging: LogOptions;
  mode: RuntimeMode;
}

/** Gather necessary framework runtimes for dynamic components */
export async function collectDynamicImports(filename: URL, { astroConfig, logging, resolve, mode }: CollectDynamic) {
  const imports = new Set<string>();

  // Only astro files
  if (!filename.pathname.endsWith('.astro') && !filename.pathname.endsWith('.md')) {
    return imports;
  }

  const extensions = astroConfig.extensions || defaultExtensions;

  let source = await readFile(filename, 'utf-8');
  if (filename.pathname.endsWith('.md')) {
    source = await convertMdToAstroSource(source);
  }

  const ast = parse(source, {
    filename,
  });

  if (!ast.module) {
    return imports;
  }

  await transform(ast, {
    filename: filename.pathname,
    fileID: '',
    compileOptions: {
      astroConfig,
      resolve,
      logging,
      mode,
    },
  });

  const componentImports: ImportDeclaration[] = [];
  const components: Record<string, { plugin: ValidExtensionPlugins; type: string; specifier: string }> = {};
  const plugins = new Set<ValidExtensionPlugins>();

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
    }
  }

  for (const componentImport of componentImports) {
    const importUrl = componentImport.source.value;
    const componentType = path.posix.extname(importUrl);
    const componentName = path.posix.basename(importUrl, componentType);
    const plugin = extensions[componentType] || defaultExtensions[componentType];
    plugins.add(plugin);
    components[componentName] = {
      plugin,
      type: componentType,
      specifier: importUrl,
    };
  }

  const dynamic = await acquireDynamicComponentImports(plugins, resolve);

  /** Add dynamic component runtimes to imports */
  function appendImports(rawName: string, importUrl: URL) {
    const [componentName, componentType] = rawName.split(':');
    if (!componentType) {
      return;
    }

    if (!components[componentName]) {
      throw new Error(`Unknown Component: ${componentName}`);
    }

    const defn = components[componentName];
    const fileUrl = new URL(defn.specifier, importUrl);
    let rel = path.posix.relative(astroConfig.astroRoot.pathname, fileUrl.pathname);

    switch (defn.plugin) {
      case 'preact': {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add(dynamic.get('preact')!);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'react': {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add(dynamic.get('react')!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add(dynamic.get('react-dom')!);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'vue': {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add(dynamic.get('vue')!);
        rel = rel.replace(/\.[^.]+$/, '.vue.js');
        break;
      }
    }

    imports.add(`/_astro/${rel}`);
  }

  walk(ast.html, {
    enter(node) {
      switch (node.type) {
        case 'Element': {
          if (node.name !== 'script') return;
          if (getAttrValue(node.attributes, 'type') !== 'module') return;

          const src = getAttrValue(node.attributes, 'src');

          if (src && src.startsWith('/')) {
            imports.add(src);
          }
          break;
        }

        case 'MustacheTag': {
          let code: string;
          try {
            code = compileExpressionSafe(node.content);
          } catch {
            return;
          }

          let matches: RegExpExecArray[] = [];
          let match: RegExpExecArray | null | undefined;
          const H_COMPONENT_SCANNER = /h\(['"]?([A-Z].*?)['"]?,/gs;
          const regex = new RegExp(H_COMPONENT_SCANNER);
          while ((match = regex.exec(code))) {
            matches.push(match);
          }
          for (const foundImport of matches.reverse()) {
            const name = foundImport[1];
            appendImports(name, filename);
          }
          break;
        }
        case 'InlineComponent': {
          if (/^[A-Z]/.test(node.name)) {
            appendImports(node.name, filename);
            return;
          }

          break;
        }
      }
    },
  });

  return imports;
}

interface BundleOptions {
  runtime: AstroRuntime;
  dist: URL;
  astroConfig: AstroConfig;
}

/** The primary bundling/optimization action */
export async function bundle(imports: Set<string>, { runtime, dist }: BundleOptions) {
  const ROOT = 'astro:root';
  const root = `
    ${[...imports].map((url) => `import '${url}';`).join('\n')}
  `;

  const inputOptions: InputOptions = {
    input: [...imports],
    plugins: [
      {
        name: 'astro:build',
        resolveId(source: string, imported?: string) {
          if (source === ROOT) {
            return source;
          }
          if (source.startsWith('/')) {
            return source;
          }

          if (imported) {
            const outUrl = new URL(source, 'http://example.com' + imported);
            return outUrl.pathname;
          }

          return null;
        },
        async load(id: string) {
          if (id === ROOT) {
            return root;
          }

          const result = await runtime.load(id);

          if (result.statusCode !== 200) {
            return null;
          }

          return result.contents.toString('utf-8');
        },
      },
    ],
  };

  const build = await rollup(inputOptions);

  const outputOptions: OutputOptions = {
    dir: dist.pathname,
    format: 'esm',
    exports: 'named',
    entryFileNames(chunk) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return chunk.facadeModuleId!.substr(1);
    },
    plugins: [
      // We are using terser for the demo, but might switch to something else long term
      // Look into that rather than adding options here.
      terser(),
    ],
  };

  await build.write(outputOptions);
}
