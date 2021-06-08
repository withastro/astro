import type { LogOptions } from './logger';
import { clearCache } from 'snowpack';
import { defaultLogDestination, defaultLogLevel, info } from './logger.js';

const logging: LogOptions = {
  level: defaultLogLevel,
  dest: defaultLogDestination,
};

export async function reload() {
  try {
    info(logging, 'reload', `Clearing the cache...`);
    await clearCache();
    return 0;
  } catch {
    return 1;
  }
}
