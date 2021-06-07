import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { clearCache, runDevServer } from './helpers.js';
import isWindows from 'is-windows';

// For some reason Windows isn't getting anything from stdout in this test, not sure why.
if(!isWindows()) {
  const SnowpackLogging = suite('snowpack logging');
  const MAX_TEST_TIME = 10000; // max time this test suite may take

  function numberOfEntries(stdout, message) {
    const exp = new RegExp(message, 'g');
    let count = 0;
    let res;
    while(res = exp.exec(stdout)) {
      count++;
    }
    return count;
  }

  const root = new URL('./fixtures/astro/basic/', import.meta.url);
  const timers = {};
  let runError = null;
  SnowpackLogging.before(async context => {
    await clearCache();

    let importantMessages = 0;
    let stdout = '';
    try {
      const process = runDevServer(root, []);

      process.stdout.setEncoding('utf8');
      for await (const chunk of process.stdout) {
        stdout += chunk;
        if (/Server started/.test(chunk)) {
          importantMessages++;
        }
        if(/Ready/.test(chunk)) {
          importantMessages++;
        }
        if(/watching for file changes/.test(chunk)) {
          importantMessages++;
        }
        if(importantMessages === 3) {
          break;
        }
      }

      context.stdout = stdout;
      process.kill();
    } catch(err) {
      console.error(err);
      runError = runError;
    }
  });

  SnowpackLogging.before.each(({ __test__ }) => {
    timers[__test__] = setTimeout(() => {
      throw new Error(`Test "${__test__}" did not finish within allowed time`);
    }, MAX_TEST_TIME);
  });

  SnowpackLogging('dev server started up', () => {
    assert.equal(runError, null);
  });

  SnowpackLogging('Logs Ready message once', async ({ stdout }) => {
    assert.equal(numberOfEntries(stdout, 'Ready'), 1);
  });

  SnowpackLogging('Logs [waiting for file changes] once', ({ stdout }) => {
    assert.equal(numberOfEntries(stdout, 'watching for file changes'), 1);
  })

  SnowpackLogging.after.each(({ __test__ }) => {
    clearTimeout(timers[__test__]);
  });

  SnowpackLogging.run();
}
