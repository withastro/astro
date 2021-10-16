import type { AstroConfig } from '../../@types/astro-core';
import type { LogOptions } from '../logger';

import http from 'http';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import * as msg from '../dev/messages.js';
import { error, info } from '../logger.js';

interface PreviewOptions {
  logging: LogOptions;
}

interface PreviewServer {
  hostname: string;
  port: number;
  server: http.Server;
  stop(): Promise<void>;
}

/** The primary dev action */
export default async function preview(config: AstroConfig, { logging }: PreviewOptions): Promise<PreviewServer> {
  const startServerTime = performance.now();

  // Create the preview server, send static files out of the `dist/` directory.
  const server = http.createServer((req, res) => {
    send(req, req.url!, {
      root: fileURLToPath(config.dist),
    }).pipe(res);
  });

  // Start listening on `hostname:port`.
  let port = config.devOptions.port;
  const { hostname } = config.devOptions;
  await new Promise<http.Server>((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      if (err.code && err.code === 'EADDRINUSE') {
        info(logging, 'astro', msg.portInUse({ port }));
        port++;
      } else {
        error(logging, 'preview', err.stack);
        server.removeListener('error', onError);
        reject(err);
      }
    };

    server
      .listen(port, hostname, () => {
        info(logging, 'preview', msg.devStart({ startupTime: performance.now() - startServerTime }));
        info(logging, 'preview', msg.devHost({ host: `http://${hostname}:${port}/` }));
        resolve(server);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        process.exit(1);
      });
  });

  return {
    hostname,
    port,
    server,
    stop: async () => {
      server.close();
    },
  };
}
