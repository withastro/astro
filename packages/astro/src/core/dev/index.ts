import type { NextFunction } from 'connect';
import type http from 'http';
import type { AstroConfig, ManifestData, RouteCache, RouteData } from '../../@types/astro';
import type { LogOptions } from '../logger';
import type { HmrContext, ModuleNode } from '../vite';

import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import connect from 'connect';
import mime from 'mime';
import { performance } from 'perf_hooks';
import stripAnsi from 'strip-ansi';
import vite from '../vite.js';
import { defaultLogOptions, error, info } from '../logger.js';
import { ssr } from '../ssr/index.js';
import { STYLE_EXTENSIONS } from '../ssr/css.js';
import { collectResources } from '../ssr/html.js';
import { createRouteManifest, matchRoute } from '../ssr/routing.js';
import { createVite } from '../create-vite.js';
import * as msg from './messages.js';
import notFoundTemplate, { subpathNotUsedTemplate } from './template/4xx.js';
import serverErrorTemplate from './template/5xx.js';
import { viteifyURL } from '../util.js';

export interface DevOptions {
  logging: LogOptions;
}

export interface DevServer {
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
    stop: () => server.stop(),
  };
}

/** Dev server */
export class AstroDevServer {
  app = connect();
  httpServer: http.Server | undefined;
  hostname: string;
  port: number;
  private config: AstroConfig;
  private logging: LogOptions;
  private manifest: ManifestData;
  private mostRecentRoute?: RouteData;
  private site: URL | undefined;
  private devRoot: string;
  private url: URL;
  private origin: string;
  private routeCache: RouteCache = {};
  private viteServer: vite.ViteDevServer | undefined;

  constructor(config: AstroConfig, options: DevOptions) {
    this.config = config;
    this.hostname = config.devOptions.hostname || 'localhost';
    this.logging = options.logging;
    this.port = config.devOptions.port;
    this.origin = `http://localhost:${this.port}`;
    this.site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
    this.devRoot = this.site ? this.site.pathname : '/';
    this.url = new URL(this.devRoot, this.origin);
    this.manifest = createRouteManifest({ config });
  }

  async start() {
    const devStart = performance.now();

    // Setup the dev server and connect it to Vite (via middleware)
    this.viteServer = await this.createViteServer();
    this.app.use(this.viteServer.middlewares);
    this.app.use((req, res, next) => this.handleRequest(req, res, next));
    this.app.use((req, res, next) => this.renderError(req, res, next));

    // Listen on port (and retry if taken)
    await this.listen(devStart);
  }

  async stop() {
    if (this.viteServer) {
      await this.viteServer.close();
    }
    if (this.httpServer) {
      await promisify(this.httpServer.close.bind(this.httpServer))();
    }
  }

  public async handleHotUpdate({ file, modules }: HmrContext): Promise<void | ModuleNode[]> {
    const { viteServer } = this;
    if (!viteServer) throw new Error(`AstroDevServer.start() not called`);

    for (const module of modules) {
      viteServer.moduleGraph.invalidateModule(module);
    }

    const route = this.mostRecentRoute;
    const [pathname, search = undefined] = (route?.pathname ?? '/').split('?');

    if (!route) {
      viteServer.ws.send({
        type: 'full-reload',
      });
      return [];
    }

    try {
      const filePath = new URL(`./${route.component}`, this.config.projectRoot);
      // try to update the most recent route
      const html = await ssr({
        astroConfig: this.config,
        filePath,
        logging: this.logging,
        mode: 'development',
        origin: this.origin,
        pathname,
        route,
        routeCache: this.routeCache,
        viteServer,
      });

      // collect style tags to be reloaded (needed for Tailwind HMR, etc.)
      let invalidatedModules: vite.ModuleNode[] = [];
      await Promise.all(
        collectResources(html)
          .filter(({ href }) => {
            if (!href) return false;
            const ext = path.extname(href);
            return STYLE_EXTENSIONS.has(ext);
          })
          .map(async ({ href }) => {
            const viteModule =
              viteServer.moduleGraph.getModuleById(`${href}?direct`) ||
              (await viteServer.moduleGraph.getModuleByUrl(`${href}?direct`)) ||
              viteServer.moduleGraph.getModuleById(href) ||
              (await viteServer.moduleGraph.getModuleByUrl(href));
            if (viteModule) {
              invalidatedModules.push(viteModule);
              viteServer.moduleGraph.invalidateModule(viteModule);
            }
          })
      );

      // TODO: log update
      viteServer.ws.send({
        type: 'custom',
        event: 'astro:reload',
        data: { html },
      });

      for (const viteModule of invalidatedModules) {
        // Note: from the time viteServer.moduleGraph.invalidateModule() is called above until now, CSS
        // is building in the background. For things like Tailwind, this can take some time. If the
        // CSS is still processing by the time HMR fires, we’ll end up with stale styles on the page.
        // TODO: fix this hack by figuring out how to add these styles to the { modules } above
        setTimeout(() => {
          viteServer.ws.send({
            type: 'update',
            updates: [
              {
                type: viteModule.type === 'js' ? 'js-update' : 'css-update',
                path: viteModule.id || viteModule.file || viteModule.url,
                acceptedPath: viteModule.url,
                timestamp: Date.now(),
              },
            ],
          });
        }, 150);
      }

      return [];
    } catch (e) {
      const err = e as Error;
      // eslint-disable-next-line
      console.error(err.stack);
      viteServer.ws.send({
        type: 'full-reload',
      });
      return [];
    }
  }

  /** Expose dev server to this.port */
  public listen(devStart: number): Promise<void> {
    let showedPortTakenMsg = false;
    return new Promise<void>((resolve, reject) => {
      const listen = () => {
        this.httpServer = this.app.listen(this.port, this.hostname, () => {
          info(this.logging, 'astro', msg.devStart({ startupTime: performance.now() - devStart }));
          info(this.logging, 'astro', msg.devHost({ host: `http://${this.hostname}:${this.port}${this.devRoot}` }));
          resolve();
        });
        this.httpServer?.on('error', onError);
      };

      const onError = (err: NodeJS.ErrnoException) => {
        if (err.code && err.code === 'EADDRINUSE') {
          if (!showedPortTakenMsg) {
            info(this.logging, 'astro', msg.portInUse({ port: this.port }));
            showedPortTakenMsg = true; // only print this once
          }
          this.port++;
          return listen(); // retry
        } else {
          error(this.logging, 'astro', err.stack);
          this.httpServer?.removeListener('error', onError);
          reject(err); // reject
        }
      };

      listen();
    });
  }

  private async createViteServer() {
    const viteConfig = await createVite(
      vite.mergeConfig(
        {
          mode: 'development',
          server: {
            middlewareMode: 'ssr',
            host: this.hostname,
          },
        },
        this.config.vite || {}
      ),
      { astroConfig: this.config, logging: this.logging, devServer: this }
    );
    const viteServer = await vite.createServer(viteConfig);

    const pagesDirectory = fileURLToPath(this.config.pages);
    viteServer.watcher.on('add', (file) => {
      // Only rebuild routes if new file is a page.
      if (!file.startsWith(pagesDirectory)) {
        return;
      }
      this.routeCache = {};
      this.manifest = createRouteManifest({ config: this.config });
    });
    viteServer.watcher.on('unlink', (file) => {
      // Only rebuild routes if deleted file is a page.
      if (!file.startsWith(pagesDirectory)) {
        return;
      }
      this.routeCache = {};
      this.manifest = createRouteManifest({ config: this.config });
    });
    viteServer.watcher.on('change', () => {
      // No need to rebuild routes on file content changes.
      // However, we DO want to clear the cache in case
      // the change caused a getStaticPaths() return to change.
      this.routeCache = {};
    });

    return viteServer;
  }

  /** The primary router (runs before Vite, in case we need to modify or intercept anything) */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) {
    if (!this.viteServer) throw new Error(`AstroDevServer.start() not called`);

    let [pathname, search = undefined] = (req.url || '/').split('?'); // original request
    const reqStart = performance.now();
    let filePath: URL | undefined;
    try {
      let routePathname: string = pathname;
      // If using a subpath, ensure that the user has included the pathname
      // such as /blog in the URL.
      if (this.devRoot !== '/') {
        if (pathname.startsWith(this.devRoot)) {
          // This includes the subpath, so strip off the subpath so that
          // matchRoute finds this route.
          routePathname = pathname.substr(this.devRoot.length) || '';
          if (!routePathname.startsWith('/')) {
            routePathname = '/' + routePathname;
          }
        } else {
          // Not using the subpath, so forward to Vite's middleware
          next();
          return;
        }
      }

      const route = matchRoute(routePathname, this.manifest);

      // 404: continue to Vite
      if (!route) {
        // Send through, stripping off the `/blog/` part so that Vite matches it.
        const newPathname = routePathname.startsWith('/') ? routePathname : '/' + routePathname;
        req.url = newPathname;
        next();
        return;
      }
      // handle .astro and .md pages
      filePath = new URL(`./${route.component}`, this.config.projectRoot);
      const html = await ssr({
        astroConfig: this.config,
        filePath,
        logging: this.logging,
        mode: 'development',
        origin: this.origin,
        pathname,
        route,
        routeCache: this.routeCache,
        viteServer: this.viteServer,
      });
      this.mostRecentRoute = route;
      info(this.logging, 'astro', msg.req({ url: pathname, statusCode: 200, reqTime: performance.now() - reqStart }));
      res.writeHead(200, {
        'Content-Type': mime.getType('.html') as string,
        'Content-Length': Buffer.byteLength(html, 'utf8'),
      });
      res.write(html);
      res.end();
    } catch (err: any) {
      const statusCode = 500;
      const mod = filePath && this.viteServer.moduleGraph.getModuleById(viteifyURL(filePath));
      if (mod) {
        for (const m of [mod, ...mod.importedModules]) {
          this.viteServer.moduleGraph.invalidateModule(m);
        }
      } else {
        this.viteServer.moduleGraph.invalidateAll();
      }
      this.viteServer.ws.send({ type: 'error', err });
      let html = serverErrorTemplate({
        statusCode,
        title: 'Internal Error',
        tabTitle: '500: Error',
        message: stripAnsi(err.message),
        url: err.url || undefined,
        stack: stripAnsi(err.stack),
      });
      html = await this.viteServer.transformIndexHtml(pathname, html, pathname);
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
        astroConfig: this.config,
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
      if (pathname === '/' && !pathname.startsWith(this.devRoot)) {
        html = subpathNotUsedTemplate(this.devRoot, pathname);
      } else {
        html = notFoundTemplate({ statusCode, title: 'Not found', tabTitle: '404: Not Found', pathname });
      }
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
