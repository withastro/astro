import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger.js';

import { logger as snowpackLogger } from 'snowpack';
import { bold, green } from 'kleur/colors';
import http from 'http';
import { relative as pathRelative } from 'path';
import { performance } from 'perf_hooks';
import { defaultLogDestination, error, info, parseError } from './logger.js';
import { createRuntime } from './runtime.js';

const hostname = '127.0.0.1';

// Disable snowpack from writing to stdout/err.
snowpackLogger.level = 'silent';

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

/** The primary dev action */
export default async function dev(astroConfig: AstroConfig) {
  const startServerTime = performance.now();
  const { projectRoot } = astroConfig;

  const runtime = await createRuntime(astroConfig, { mode: 'development', logging });

  const server = http.createServer(async (req, res) => {
    const result = await runtime.load(req.url);

    switch (result.statusCode) {
      case 200: {
        if (result.contentType) {
          res.setHeader('Content-Type', result.contentType);
        }
        res.statusCode = 200;
        res.write(result.contents);
        res.end();
        break;
      }
      case 404: {
        const fullurl = new URL(req.url || '/', 'https://example.org/');
        const reqPath = decodeURI(fullurl.pathname);
        error(logging, 'static', 'Not found', reqPath);
        res.statusCode = 404;

        const fourOhFourResult = await runtime.load('/404');
        if (fourOhFourResult.statusCode === 200) {
          if (fourOhFourResult.contentType) {
            res.setHeader('Content-Type', fourOhFourResult.contentType);
          }
          res.write(fourOhFourResult.contents);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.write('Not Found');
        }
        res.end();
        break;
      }
      case 500: {
        switch (result.type) {
          case 'parse-error': {
            const err = result.error;
            err.filename = pathRelative(projectRoot.pathname, err.filename);
            parseError(logging, err);
            break;
          }
          default: {
            error(logging, 'executing astro', result.error);
            break;
          }
        }
        res.statusCode = 500;
        res.end(formatErrorForBrowser(result.error));
        break;
      }
    }
  });

  const port = astroConfig.devOptions.port;
  server.listen(port, hostname, () => {
    const endServerTime = performance.now();
    info(logging, 'dev server', green(`Server started in ${Math.floor(endServerTime - startServerTime)}ms.`));
    info(logging, 'dev server', `${green('Local:')} http://${hostname}:${port}/`);
  });
}

/** Format error message */
function formatErrorForBrowser(err: Error) {
  // TODO make this pretty.
  return err.toString();
}
