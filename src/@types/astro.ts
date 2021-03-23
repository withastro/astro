export interface AstroConfigRaw {
  dist: string;
  projectRoot: string;
  hmxRoot: string;
  jsx?: string;
}

export type ValidExtensionPlugins = 'hmx' | 'react' | 'preact' | 'svelte' | 'vue';

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  hmxRoot: URL;
  extensions?: Record<string, ValidExtensionPlugins>
}

export interface JsxItem {
  name: string;
  jsx: string;
}

export interface TransformResult {
  script: string;
  head: JsxItem | undefined;
  items: JsxItem[];
}

export interface CompileResult {
  result: TransformResult;
  contents: string;
}
