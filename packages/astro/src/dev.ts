import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger.js';

import { green } from 'kleur/colors';
import http from 'http';
import path from 'path';
import { performance } from 'perf_hooks';
import { defaultLogDestination, defaultLogLevel, debug, error, info, parseError } from './logger.js';
import { createRuntime } from './runtime.js';
import { stopTimer } from './build/util.js';

const logging: LogOptions = {
  level: defaultLogLevel,
  dest: defaultLogDestination,
};

/** The primary dev action */
export default async function dev(astroConfig: AstroConfig) {
  const startServerTime = performance.now();
  const { projectRoot } = astroConfig;
  const timer: Record<string, number> = {};

  timer.runtime = performance.now();
  const runtime = await createRuntime(astroConfig, { mode: 'development', logging });
  debug(logging, 'dev', `runtime created [${stopTimer(timer.runtime)}]`);

  const server = http.createServer(async (req, res) => {
    timer.load = performance.now();

    const result = await runtime.load(req.url);
    debug(logging, 'dev', `loaded ${req.url} [${stopTimer(timer.load)}]`);

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
      case 301:
      case 302: {
        res.statusCode = result.statusCode;
        res.setHeader('Location', result.location);
        res.end();
        break;
      }
      case 404: {
        const { hostname, port } = astroConfig.devOptions;
        const fullurl = new URL(req.url || '/', astroConfig.buildOptions.site || `http://${hostname}:${port}`);
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
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        switch (result.type) {
          case 'parse-error': {
            const err = result.error;
            if (err.filename) err.filename = path.posix.relative(projectRoot.pathname, err.filename);
            parseError(logging, err);
            break;
          }
          default: {
            error(logging, 'executing astro', result.error);
            break;
          }
        }
        res.statusCode = 500;

        let errorResult = await runtime.load(`/500?error=${encodeURIComponent(result.error.stack || result.error.toString())}`);
        if (errorResult.statusCode === 200) {
          if (errorResult.contentType) {
            res.setHeader('Content-Type', errorResult.contentType);
          }
          res.write(errorResult.contents);
        } else {
          res.write(result.error.toString());
        }
        res.end();
        break;
      }
    }
  });

  const { hostname, port } = astroConfig.devOptions;
  server
    .listen(port, hostname, () => {
      const endServerTime = performance.now();
      info(logging, 'dev server', green(`Server started in ${Math.floor(endServerTime - startServerTime)}ms.`));
      info(logging, 'dev server', `${green('Local:')} http://${hostname}:${port}/`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code && err.code === 'EADDRINUSE') {
        error(logging, 'dev server', `Address ${hostname}:${port} already in use. Try changing devOptions.port in your config file`);
      } else {
        error(logging, 'dev server', err.stack);
      }
      process.exit(1);
    });
}
