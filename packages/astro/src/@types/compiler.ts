import type { LogOptions } from '../logger';
import type { AstroConfig, RuntimeMode } from './astro';
import type { SnowpackDevServer } from 'snowpack';

export interface CompileOptions {
  logging: LogOptions;
  resolvePackageUrl: (p: string) => Promise<string>;
  loadUrl: SnowpackDevServer['loadUrl'];
  astroConfig: AstroConfig;
  mode: RuntimeMode;
}
