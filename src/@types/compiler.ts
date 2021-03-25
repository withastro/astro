import type { LogOptions } from '../logger';
import type { ValidExtensionPlugins } from './astro';

export interface CompileOptions {
  logging: LogOptions;
  resolve: (p: string) => Promise<string>;
  extensions?: Record<string, ValidExtensionPlugins>;
}
