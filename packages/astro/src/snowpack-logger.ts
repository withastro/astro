import { logger as snowpackLogger } from 'snowpack';

function verboseLogging() {
  return process.argv.includes('--verbose');
}

const onceMessages = [
  'Ready!',
  'watching for file changes'
].map(str => new RegExp(`\\[snowpack\\](.*?)${str}`));

export function configureSnowpackLogger(logger: typeof snowpackLogger) {
  const messageCache = new Set<string>();

  if(verboseLogging()) {
    logger.level = 'debug';
  }

  logger.on('info', message => {
    // Cache messages that should only be shown once.
    // This is due to having 2 snowpack instances. Once that is removed we can
    // get rid of this workaround.
    if(messageCache.has(message)) {
      return;
    }

    const shouldBeCached = onceMessages.some(exp => exp.test(message));
    if(shouldBeCached) {
     messageCache.add(message);
    }

    console.log(message);
  });
}