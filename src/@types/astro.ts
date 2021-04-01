import type { Optimizer } from './optimizer';

export type ValidExtensionPlugins = 'astro' | 'react' | 'preact' | 'svelte' | 'vue';

export interface AstroPlugin {
  transform(): Optimizer;
}

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  astroRoot: URL;
  public: URL;
  extensions?: Record<string, ValidExtensionPlugins>;
  plugins?: AstroPlugin[];
}

export interface JsxItem {
  name: string;
  jsx: string;
}

export interface TransformResult {
  script: string;
  imports: string[];
  items: JsxItem[];
  css?: string;
}

export interface CompileResult {
  result: TransformResult;
  contents: string;
  css?: string;
}

export type RuntimeMode = 'development' | 'production';
