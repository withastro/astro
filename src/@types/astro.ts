export interface AstroConfigRaw {
  dist: string;
  projectRoot: string;
  astroRoot: string;
  public: string;
  jsx?: string;
}

export type ValidExtensionPlugins = 'astro' | 'react' | 'preact' | 'svelte' | 'vue';

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  astroRoot: URL;
  public: URL;
  extensions?: Record<string, ValidExtensionPlugins>;
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
