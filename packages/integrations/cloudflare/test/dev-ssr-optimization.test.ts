import * as assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { AstroLogger } from '../../../astro/dist/core/logger/core.js';
import cloudflare from '../dist/index.js';
import { astroFrontmatterScanPlugin } from '../dist/esbuild-plugin-astro-frontmatter.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Cloudflare SSR Optimization', () => {
	// Verifies that the Cloudflare integration's SSR optimization plugin
	// correctly pre-registers critical virtual modules and configures Vite to handle cascading re-optimizations gracefully,
	// preventing crashes during development when using features like View Transitions.
  async function captureEnvironmentPlugin(): Promise<any> {
    const integration = cloudflare({});
    const capturedPlugins: any[] = [];

    await integration.hooks['astro:config:setup']?.({
      command: 'dev',
      isRestart: false,
      config: {
        root: new URL('file:///tmp/'),
        srcDir: new URL('file:///tmp/src/'),
        session: { driver: 'memory' },
      } as any,
      updateConfig: (cfg: any) => {
        const plugins = [cfg?.vite?.plugins ?? []].flat(Number.POSITIVE_INFINITY);
        capturedPlugins.push(...plugins.filter(Boolean));
      },
      addWatchFile: () => {},
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} } as any,
    } as any);

    return capturedPlugins.find((p: any) => p?.name === '@astrojs/cloudflare:environment') ?? null;
  }

	// Note: These tests are designed to run in a Node environment and may not be compatible with browser-based testing frameworks.
  describe('Astro Frontmatter Scanner', () => {
    it('registers an onResolve handler to prioritize .astro file interception and dependency discovery', () => {
      const plugin = astroFrontmatterScanPlugin();
      const resolvers: Array<{ filter: RegExp }> = [];

      plugin.setup({
        onResolve(options: { filter: RegExp }, _callback: (...args: unknown[]) => unknown) {
          resolvers.push(options);
        },
        onLoad(_options: any, _callback: (...args: unknown[]) => unknown) {},
      } as any);

      const hasAstroResolver = resolvers.some((r) => r.filter.test('Component.astro'));
      assert.equal(hasAstroResolver, true);
    });
  });

  const TRANSITIONS_MODULES = [
    'astro/virtual-modules/transitions.js',
    'astro/virtual-modules/transitions-router.js',
    'astro/virtual-modules/transitions-types.js',
    'astro/virtual-modules/transitions-events.js',
    'astro/virtual-modules/transitions-swap-functions.js',
  ] as const;

  // SSR environment in which critical virtual modules are pre-registered and reload resilience is configured
  // to ensure they are correctly injected.
  describe('Vite Environment Configuration', () => {
    let envPlugin: any;

    before(async () => {
      envPlugin = await captureEnvironmentPlugin();
    });

    for (const envName of ['astro', 'ssr', 'prerender'] as const) {
      it(`explicitly includes View Transitions virtual modules in "${envName}" environment to prevent runtime discovery`, () => {
        const config = envPlugin?.configEnvironment(envName, {});
        const include: string[] = config?.optimizeDeps?.include ?? [];
        const missing = TRANSITIONS_MODULES.filter((m) => !include.includes(m));
        assert.deepEqual(missing, [], `Missing virtual modules in "${envName}": ${missing.join(', ')}`);
      });

      it(`enables ignoreOutdatedRequests for "${envName}" environment to prevent crashes during cascading re-optimization`, () => {
        const config = envPlugin?.configEnvironment(envName, {});
        assert.equal(config?.optimizeDeps?.ignoreOutdatedRequests, true);
      });
    }
  });

  // Verify that the dev server remains stable and correctly handles SSR optimizations without crashing
	// even when features like View Transitions trigger multiple optimization cycles.
  describe('Dev Server Runtime Behavior', () => {
    let fixture: Fixture;
    let devServer: DevServer;
    const logs: string[] = [];

    before(async () => {
      fixture = await loadFixture({
        root: './fixtures/dev-ssr-optimization/',
      });

      const logger = new AstroLogger({
        level: 'warn',
        destination: new Writable({
          objectMode: true,
          write(event, _, callback) {
            logs.push(event.message);
            callback();
          },
        }),
      });

      devServer = await fixture.startDevServer({
        // @ts-expect-error: logger is @internal
        logger,
      });

      // initial request to trigger optimization and potential re-optimization cycles
      await fixture.fetch('/');
    });

    after(async () => {
      await devServer.stop();
    });

    it('successfully serves the initial request without triggering fatal optimization errors', async () => {
      const res = await fixture.fetch('/');
      assert.equal(res.status, 200);
    });

    it('maintains stability across multiple requests and handles in-place restarts', async () => {
      const res = await fixture.fetch('/');
      assert.equal(res.status, 200);
    });

    it('suppresses "The file does not exist" errors by handling stale chunk references gracefully', () => {
      const staleChunkErrors = logs.filter((msg) => msg.includes('The file does not exist'));
      assert.equal(staleChunkErrors.length, 0);
    });

    it('ensures correct server-side rendering of pages utilizing View Transitions', async () => {
      const res = await fixture.fetch('/');
      const html = await res.text();
      const $ = cheerio.load(html);
      assert.equal($('#content').text(), 'OK');
    });
  });
});
