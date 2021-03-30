import type { LogOptions } from '../logger';
import type { AstroConfig, ValidExtensionPlugins } from './astro';

export interface CompileOptions {
  logging: LogOptions;
  resolve: (p: string) => Promise<string>;
  astroConfig: AstroConfig;
  extensions?: Record<string, ValidExtensionPlugins>;
}
