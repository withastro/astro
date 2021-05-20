import type { LogOptions } from '../logger';
import type { AstroConfig, RuntimeMode, ValidExtensionPlugins } from './astro';

export interface CompileOptions {
  logging: LogOptions;
  resolvePackageUrl: (p: string) => Promise<string>;
  astroConfig: AstroConfig;
  extensions?: Record<string, ValidExtensionPlugins>;
  mode: RuntimeMode;
  tailwindConfig?: string;
}
