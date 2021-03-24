import { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime } from 'snowpack';
import { LogOptions } from '../logger';

export interface AstroConfigRaw {
  dist: string;
  projectRoot: string;
  astroRoot: string;
  jsx?: string;
}

export type ValidExtensionPlugins = 'astro' | 'react' | 'preact' | 'svelte' | 'vue';

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  astroRoot: URL;
  extensions?: Record<string, ValidExtensionPlugins>;
}

export interface JsxItem {
  name: string;
  jsx: string;
}

export interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
  snowpack: SnowpackDevServer;
  snowpackRuntime: SnowpackServerRuntime;
}

export interface TransformResult {
  script: string;
  props: string[];
  items: JsxItem[];
}

export interface CompileResult {
  result: TransformResult;
  contents: string;
}
