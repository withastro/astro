import type { AstroConfig, ValidExtensionPlugins } from '../@types/astro';
import type { ImportDeclaration, ExportNamedDeclaration, VariableDeclarator, Identifier, VariableDeclaration } from '@babel/types';
import type { InputOptions, OutputOptions } from 'rollup';
import type { AstroRuntime } from '../runtime';

import esbuild from 'esbuild';
import { promises as fsPromises } from 'fs';
import { parse } from '../parser/index.js';
import { walk } from 'estree-walker';
import babelParser from '@babel/parser';
import path from 'path';
import { rollup } from 'rollup';

const { transformSync } = esbuild;
const { readFile } = fsPromises;

type DynamicImportMap = Map<'vue' | 'react' | 'react-dom' | 'preact', string>;

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

export async function collectDynamicImports(filename: URL, astroConfig: AstroConfig, resolve: (s: string) => Promise<string>) {
  const imports = new Set<string>();

  // No markdown for now
  if (filename.pathname.endsWith('md')) {
    return imports;
  }

  const extensions = astroConfig.extensions || defaultExtensions;
  const source = await readFile(filename, 'utf-8');
  const ast = parse(source, {
    filename,
  });

  if (!ast.module) {
    return imports;
  }

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

  function appendImports(rawName: string, filename: URL, astroConfig: AstroConfig) {
    const [componentName, componentType] = rawName.split(':');
    if (!componentType) {
      return;
    }

    if (!components[componentName]) {
      throw new Error(`Unknown Component: ${componentName}`);
    }

    const defn = components[componentName];
    const fileUrl = new URL(defn.specifier, filename);
    let rel = path.posix.relative(astroConfig.astroRoot.pathname, fileUrl.pathname);

    switch (defn.plugin) {
      case 'preact': {
        imports.add(dynamic.get('preact')!);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'react': {
        imports.add(dynamic.get('react')!);
        imports.add(dynamic.get('react-dom')!);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'vue': {
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
          for (const match of matches.reverse()) {
            const name = match[1];
            appendImports(name, filename, astroConfig);
          }
          break;
        }
        case 'InlineComponent': {
          if (/^[A-Z]/.test(node.name)) {
            appendImports(node.name, filename, astroConfig);
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
      return chunk.facadeModuleId!.substr(1);
    },
  };

  await build.write(outputOptions);
}
