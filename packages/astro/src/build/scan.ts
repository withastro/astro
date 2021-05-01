import type { ImportDeclaration } from '@babel/types';
import type { AstroConfig, PageDependencies, RuntimeMode, ValidExtensionPlugins } from '../@types/astro';
import type { LogOptions } from '../logger';

import { parse } from 'astro-parser';
import { walk } from 'estree-walker';
import babelParser from '@babel/parser';
import cheerio from 'cheerio';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from '../compiler/transform/index.js';
import { convertMdToAstroSource } from '../compiler/index.js';
import { getAttrValue } from '../ast.js';
import { sortSet, absoluteURL } from './util.js';

interface CollectDynamic {
  astroConfig: AstroConfig;
  resolvePackageUrl: (s: string) => Promise<string>;
  logging: LogOptions;
  mode: RuntimeMode;
}

type DynamicImportMap = Map<'vue' | 'react' | 'react-dom' | 'preact' | 'svelte', string>;

/** Is this URL remote? */
function isRemote(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return true;
  return false;
}

/** Given an HTML string, collect <link> and <img> tags */
export function scanHTML(html: string, { cwd }: { cwd: string }): PageDependencies {
  const pageDeps: PageDependencies = {
    js: new Set<string>(),
    css: new Set<string>(),
    images: new Set<string>(),
  };

  const $ = cheerio.load(html);

  $('script').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !isRemote(src)) {
      pageDeps.js.add(absoluteURL(src, cwd));
    }
  });

  $('link[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !isRemote(href) && ($(el).attr('rel') === 'stylesheet' || $(el).attr('type') === 'text/css' || href.endsWith('.css'))) {
      pageDeps.css.add(absoluteURL(href, cwd));
    }
  });

  $('img[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !isRemote(src)) {
      pageDeps.images.add(absoluteURL(src, cwd));
    }
  });

  // sort (makes things a bit more predictable)
  pageDeps.js = sortSet(pageDeps.js);
  pageDeps.css = sortSet(pageDeps.css);
  pageDeps.images = sortSet(pageDeps.images);

  return pageDeps;
}

/** Evaluate mustache expression (safely) */
function compileExpressionSafe(raw: string): string {
  let { code } = esbuild.transformSync(raw, {
    loader: 'tsx',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    charset: 'utf8',
  });
  return code;
}
/** Add framework runtimes when needed */
async function acquireDynamicComponentImports(plugins: Set<ValidExtensionPlugins>, resolvePackageUrl: (s: string) => Promise<string>): Promise<DynamicImportMap> {
  const importMap: DynamicImportMap = new Map();
  for (let plugin of plugins) {
    switch (plugin) {
      case 'svelte': {
        importMap.set('svelte', await resolvePackageUrl('svelte'));
        break;
      }
      case 'vue': {
        importMap.set('vue', await resolvePackageUrl('vue'));
        break;
      }
      case 'react': {
        importMap.set('react', await resolvePackageUrl('react'));
        importMap.set('react-dom', await resolvePackageUrl('react-dom'));
        break;
      }
      case 'preact': {
        importMap.set('preact', await resolvePackageUrl('preact'));
        break;
      }
    }
  }
  return importMap;
}

const defaultExtensions: Readonly<Record<string, ValidExtensionPlugins>> = {
  '.jsx': 'react',
  '.tsx': 'react',
  '.svelte': 'svelte',
  '.vue': 'vue',
};

/** Gather necessary framework runtimes for dynamic components */
export async function collectDynamicImports(filename: URL, { astroConfig, logging, resolvePackageUrl, mode }: CollectDynamic) {
  const imports = new Set<string>();

  // Only astro files
  if (!filename.pathname.endsWith('.astro') && !filename.pathname.endsWith('.md')) {
    return imports;
  }

  const extensions = astroConfig.extensions || defaultExtensions;

  let source = await fs.promises.readFile(filename, 'utf-8');
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
    filename: fileURLToPath(filename),
    fileID: '',
    compileOptions: {
      astroConfig,
      resolvePackageUrl,
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

  const dynamic = await acquireDynamicComponentImports(plugins, resolvePackageUrl);

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
      case 'svelte': {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add(dynamic.get('svelte')!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imports.add('/_astro_internal/runtime/svelte.js');
        rel = rel.replace(/\.[^.]+$/, '.svelte.js');
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
