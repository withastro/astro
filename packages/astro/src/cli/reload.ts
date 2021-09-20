import type { LogOptions } from '../logger';
import rimraf from 'rimraf';
import { fileURLToPath } from 'url';
import { defaultLogDestination, defaultLogLevel, info } from '../logger.js';

const logging: LogOptions = {
  level: defaultLogLevel,
  dest: defaultLogDestination,
};

export async function reload(cwd: string) {
  try {
    info(logging, 'reload', `Clearing the cache...`);
    const viteCache = new URL('node_modules/.vite/', `file://${cwd}/`);
    rimraf.sync(fileURLToPath(viteCache));
    return 0;
  } catch {
    return 1;
  }
}
