import type { LogOptions } from '../logger';

export interface CompileOptions {
  logging: LogOptions;
  resolve: (p: string) => string;
}
