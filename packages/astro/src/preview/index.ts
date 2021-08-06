import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../logger.js';

import http from 'http';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import * as msg from '../dev/messages.js';
import { error, info } from '../logger.js';

interface PreviewOptions {
  logging: LogOptions;
}

/** The primary dev action */
export async function preview(config: AstroConfig, { logging }: PreviewOptions) {
  const {
    dist,
    devOptions: { hostname, port },
  } = config;

  const startServerTime = performance.now();

  // Create the preview server, send static files out of the `dist/` directory.
  const server = http.createServer((req, res) => {
    send(req, req.url!, {
      root: fileURLToPath(dist),
    }).pipe(res);
  });

  // Start listening on `hostname:port`.
  return server
    .listen(port, hostname, () => {
      info(logging, 'preview', msg.devStart({ startupTime: performance.now() - startServerTime }));
      info(logging, 'preview', msg.devHost({ host: `http://${hostname}:${port}/` }));
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code && err.code === 'EADDRINUSE') {
        error(logging, 'preview', `Address ${hostname}:${port} already in use. Try changing devOptions.port in your config file`);
      } else {
        error(logging, 'preview', err.stack);
      }
      process.exit(1);
    });
}
