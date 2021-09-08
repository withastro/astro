import http from 'http';
import { green } from 'kleur/colors';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import type { AstroConfig } from './@types/astro';
import { debug, LogOptions } from './logger.js';
import { defaultLogDestination, defaultLogLevel, error, info } from './logger.js';
import { createRuntime } from './runtime.js';
import { matchRouteHandler } from './util.js';

const logging: LogOptions = {
  level: defaultLogLevel,
  dest: defaultLogDestination,
};

/** The primary dev action */
export async function preview(astroConfig: AstroConfig) {
  const startServerTime = performance.now();
  const runtime = await createRuntime(astroConfig, { mode: 'development', logging });

  const { hostname, port } = astroConfig.devOptions;
  // Create the preview server, send static files out of the `dist/` directory.
  const server = http.createServer((req, res) => {
    let reqUrl = req.url;
    const routeHandlerMatch = matchRouteHandler(runtime.runtimeConfig, reqUrl || '', 'dest');
    if (routeHandlerMatch) {
      if ('function' === typeof routeHandlerMatch) {
        routeHandlerMatch(req, res);
        return;
      }
      // it is a string
      reqUrl = routeHandlerMatch;
    }

    send(req, reqUrl!, { root: fileURLToPath(astroConfig.dist) }).pipe(res);
  });
  // Start listening on `hostname:port`.
  return server
    .listen(port, hostname, () => {
      const endServerTime = performance.now();
      info(logging, 'preview', green(`Preview server started in ${Math.floor(endServerTime - startServerTime)}ms.`));
      info(logging, 'preview', `${green('Local:')} http://${hostname}:${port}/`);
    })
    .on('close', () => {
      runtime.shutdown();
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code && err.code === 'EADDRINUSE') {
        error(logging, 'preview', `Address ${hostname}:${port} already in use. Try changing devOptions.port in your config file`);
      } else {
        error(logging, 'preview', err.stack);
      }
      runtime.shutdown();
      process.exit(1);
    });
}
