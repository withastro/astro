import { logger as snowpackLogger } from 'snowpack';
import { defaultLogLevel } from './logger.js';

export function configureSnowpackLogger(logger: typeof snowpackLogger) {
  if (defaultLogLevel === 'debug') {
    logger.level = 'debug';
  }
}
