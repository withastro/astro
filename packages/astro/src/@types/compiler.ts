import type { LogOptions } from '../logger';
import type { AstroConfig, RuntimeMode } from './astro';

export interface CompileOptions {
  logging: LogOptions;
  resolvePackageUrl: (p: string) => Promise<string>;
  astroConfig: AstroConfig;
  mode: RuntimeMode;
  tailwindConfig?: string;
}
