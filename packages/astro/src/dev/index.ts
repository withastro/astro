import type { NextFunction } from 'connect';
import type http from 'http';
import type { AstroConfig, ManifestData, RouteCache } from '../@types/astro';
import type { LogOptions } from '../logger';

import chokidar from 'chokidar';
import connect from 'connect';
import mime from 'mime';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import vite from 'vite';
import { defaultLogOptions, error, info } from '../logger.js';
import { createRouteManifest, matchRoute } from '../runtime/routing.js';
import { ssr } from '../runtime/ssr.js';
import { loadViteConfig } from '../runtime/vite/config.js';
import * as msg from './messages.js';
import { errorTemplate } from './template/error.js';

export interface DevOptions {
  logging: LogOptions;
}

interface DevServer {
  hostname: string;
  port: number;
  server: connect.Server;
  stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(config: AstroConfig, options: DevOptions = { logging: defaultLogOptions }): Promise<DevServer> {
  // start dev server
  const server = new AstroDevServer(config, options);
  await server.start();

  // attempt shutdown
  process.on('SIGTERM', () => server.stop());
  return {
    hostname: server.hostname,
    port: server.port,
    server: server.app,
    stop: server.stop,
  };
}

/** Dev server */
class AstroDevServer {
  app = connect();
  hostname: string;
  port: number;

  private config: AstroConfig;
  private logging: LogOptions;
  private manifest: ManifestData;
  private origin: string;
  private routeCache: RouteCache = {};
  private viteServer: vite.ViteDevServer | undefined;
  private watcher: chokidar.FSWatcher;

  constructor(config: AstroConfig, options: DevOptions) {
    this.config = config;
    this.hostname = config.devOptions.hostname || 'localhost';
    this.logging = options.logging;
    this.port = config.devOptions.port;
    this.origin = config.buildOptions.site ? new URL(config.buildOptions.site).origin : `http://localhost:${this.port}`;
    this.manifest = createRouteManifest({ config });

    // rebuild manifest on change (watch all events, but only rebuild if .astro or .md files are touched)
    this.watcher = chokidar.watch(fileURLToPath(config.pages), { ignored: ['!**/*.astro', '!**/*.md', '**'] }); // ignore everything but .astro & .md
    this.watcher.on('add', () => {
      this.routeCache = {};
      this.manifest = createRouteManifest({ config: this.config });
    });
    this.watcher.on('unlink', () => {
      this.routeCache = {};
      this.manifest = createRouteManifest({ config: this.config });
    });
    this.watcher.on('change', () => {
      this.routeCache = {}; // note: manifests don’t need to be rebuilt on file content changes
    });
  }

  /** Start dev server */
  async start() {
    // 1. profile startup time
    const devStart = performance.now();

    // 2. create Vite instance
    const viteConfig = await loadViteConfig(
      {
        mode: 'development',
        server: {
          middlewareMode: 'ssr',
          host: this.hostname,
        },
      },
      { astroConfig: this.config, logging: this.logging }
    );
    this.viteServer = await vite.createServer(viteConfig);

    // 3. add middlewares
    this.app.use((req, res, next) => this.handleRequest(req, res, next));
    this.app.use(this.viteServer.middlewares);
    this.app.use((req, res, next) => this.renderError(req, res, next));

    // 4. listen on port
    await new Promise<void>((resolve, reject) => {
      this.app
        .listen(this.port, this.hostname, () => {
          info(this.logging, 'astro', msg.devStart({ startupTime: performance.now() - devStart }));
          info(this.logging, 'astro', msg.devHost({ host: `http://${this.hostname}:${this.port}` }));
          resolve();
        })
        .on('error', (err: NodeJS.ErrnoException) => {
          if (err.code && err.code === 'EADDRINUSE') {
            error(this.logging, 'astro', `Address ${this.hostname}:${this.port} already in use. Try changing devOptions.port in your config file`);
          } else {
            error(this.logging, 'astro', err.stack);
          }
          reject();
          process.exit(1);
        });
    });
  }

  /** Stop dev server */
  async stop() {
    await Promise.all([
      ...(this.viteServer ? [this.viteServer.close()] : []), // close Vite server
      this.watcher.close(), // close chokidar
    ]);
  }

  /** The primary router (runs before Vite, in case we need to modify or intercept anything) */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) {
    if (!this.viteServer) throw new Error(`AstroDevServer.start() not called`);

    let pathname = req.url || '/'; // original request
    const reqStart = performance.now();

    try {
      const route = matchRoute(pathname, this.manifest);

      // 404: continue to Vite
      if (!route) {
        next();
        return;
      }

      // handle .astro and .md pages
      const html = await ssr({
        filePath: new URL(`./${route.component}`, this.config.projectRoot),
        logging: this.logging,
        mode: 'development',
        origin: this.origin,
        pathname,
        route,
        routeCache: this.routeCache,
        viteServer: this.viteServer,
      });
      info(this.logging, 'astro', msg.req({ url: pathname, statusCode: 200, reqTime: performance.now() - reqStart }));
      res.writeHead(200, {
        'Content-Type': mime.getType('.html') as string,
        'Content-Length': Buffer.byteLength(html, 'utf8'),
      });
      res.write(html);
      res.end();
    } catch (e) {
      const err = e as Error;
      this.viteServer.ssrFixStacktrace(err);
      console.error(err.stack);
      const statusCode = 500;
      const html = errorTemplate({ statusCode, title: 'Internal Error', tabTitle: '500: Error', message: err.message });
      info(this.logging, 'astro', msg.req({ url: pathname, statusCode: 500, reqTime: performance.now() - reqStart }));
      res.writeHead(statusCode, {
        'Content-Type': mime.getType('.html') as string,
        'Content-Length': Buffer.byteLength(html, 'utf8'),
      });
      res.write(html);
      res.end();
    }
  }

  /** Render error page */
  private async renderError(req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) {
    if (!this.viteServer) throw new Error(`AstroDevServer.start() not called`);

    const pathname = req.url || '/';
    const reqStart = performance.now();
    let html = '';
    const statusCode = 404;

    // attempt to load user-given page
    const relPages = this.config.pages.href.replace(this.config.projectRoot.href, '');
    const userDefined404 = this.manifest.routes.find((route) => route.component === relPages + '404.astro');
    if (userDefined404) {
      html = await ssr({
        filePath: new URL(`./${userDefined404.component}`, this.config.projectRoot),
        logging: this.logging,
        mode: 'development',
        pathname: `/${userDefined404.component}`,
        origin: this.origin,
        routeCache: this.routeCache,
        viteServer: this.viteServer,
      });
    }
    // if not found, fall back to default template
    else {
      html = errorTemplate({ statusCode, title: 'Not found', tabTitle: '404: Not Found', message: pathname });
    }
    info(this.logging, 'astro', msg.req({ url: pathname, statusCode, reqTime: performance.now() - reqStart }));
    res.writeHead(statusCode, {
      'Content-Type': mime.getType('.html') as string,
      'Content-Length': Buffer.byteLength(html, 'utf8'),
    });
    res.write(html);
    res.end();
  }
}
