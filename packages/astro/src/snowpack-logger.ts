import { logger as snowpackLogger } from 'snowpack';
import { defaultLogLevel } from './logger.js';

const onceMessages = ['Ready!', 'watching for file changes'].map((str) => new RegExp(`\\[snowpack\\](.*?)${str}`));

const neverWarn = new RegExp(
  '(' +
    /(run "snowpack init" to create a project config file.)|/.source +
    /(Unscannable package import found.)|/.source +
    /(Cannot call a namespace \('loadLanguages'\))|/.source +
    /('default' is imported from external module 'node-fetch' but never used)/.source +
    ')'
);

export function configureSnowpackLogger(logger: typeof snowpackLogger) {
  const messageCache = new Set<string>();

  if (defaultLogLevel === 'debug') {
    logger.level = 'debug';
  }

  logger.on('warn', (message) => {
    // Silence this output message, since it doesn't make sense for Astro.
    if (neverWarn.test(message)) {
      return;
    }
    console.error(message);
  });

  logger.on('info', (message) => {
    // Cache messages that should only be shown once.
    // This is due to having 2 snowpack instances. Once that is removed we can
    // get rid of this workaround.
    if (messageCache.has(message)) {
      return;
    }

    const shouldBeCached = onceMessages.some((exp) => exp.test(message));
    if (shouldBeCached) {
      messageCache.add(message);
    }

    console.log(message);
  });
}
