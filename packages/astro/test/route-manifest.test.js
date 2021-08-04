import { fileURLToPath } from 'url';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createManifest } from '../dist/manifest/create.js';

const cwd = new URL('./fixtures/route-manifest/', import.meta.url);

/**
 * @param {string} dir
 * @param {string[]} [extensions]
 * @returns
 */
const create = (dir) => {
  return createManifest({
    config: {
      projectRoot: cwd,
      pages: new URL(dir, cwd),
    },
    cwd: fileURLToPath(cwd),
  });
};
function cleanRoutes(routes) {
  return routes.map((r) => {
    delete r.generate;
    return r;
  });
}

test('creates routes', () => {
  const { routes } = create('basic');
  assert.equal(cleanRoutes(routes), [
    {
      type: 'page',
      pattern: /^\/$/,
      params: [],
      component: 'basic/index.astro',
      path: '/',
    },

    {
      type: 'page',
      pattern: /^\/about\/?$/,
      params: [],
      component: 'basic/about.astro',
      path: '/about',
    },

    {
      type: 'page',
      pattern: /^\/blog\/?$/,
      params: [],
      component: 'basic/blog/index.astro',
      path: '/blog',
    },

    {
      type: 'page',
      pattern: /^\/blog\/([^/]+?)\/?$/,
      params: ['slug'],
      component: 'basic/blog/[slug].astro',
      path: null,
    },
  ]);
});

test('encodes invalid characters', () => {
  const { routes } = create('encoding');

  // had to remove ? and " because windows

  // const quote = 'encoding/".astro';
  const hash = 'encoding/#.astro';
  // const question_mark = 'encoding/?.astro';

  assert.equal(
    routes.map((p) => p.pattern),
    [
      // /^\/%22$/,
      /^\/%23\/?$/,
      // /^\/%3F$/
    ]
  );
});

test('ignores files and directories with leading underscores', () => {
  const { routes } = create('hidden-underscore');

  assert.equal(routes.map((r) => r.component).filter(Boolean), ['hidden-underscore/index.astro', 'hidden-underscore/e/f/g/h.astro']);
});

test('ignores files and directories with leading dots except .well-known', () => {
  const { routes } = create('hidden-dot');

  assert.equal(routes.map((r) => r.component).filter(Boolean), ['hidden-dot/.well-known/dnt-policy.astro']);
});

test('fails if dynamic params are not separated', () => {
  assert.throws(() => {
    create('invalid-params');
  }, /Invalid route invalid-params\/\[foo\]\[bar\]\.astro — parameters must be separated/);
});

test('disallows rest parameters inside segments', () => {
  assert.throws(
    () => {
      create('invalid-rest');
    },
    /** @param {Error} e */
    (e) => {
      return e.message === 'Invalid route invalid-rest/foo-[...rest]-bar.astro — rest parameter must be a standalone segment';
    }
  );
});

test('ignores things that look like lockfiles', () => {
  const { routes } = create('lockfiles');
  assert.equal(cleanRoutes(routes), [
    {
      type: 'page',
      pattern: /^\/foo\/?$/,
      params: [],
      component: 'lockfiles/foo.astro',
      path: '/foo',
    },
  ]);
});

test('allows multiple slugs', () => {
  const { routes } = create('multiple-slugs');

  assert.equal(cleanRoutes(routes), [
    {
      type: 'page',
      pattern: /^\/([^/]+?)\.([^/]+?)\/?$/,
      component: 'multiple-slugs/[file].[ext].astro',
      params: ['file', 'ext'],
      path: null,
    },
  ]);
});

test('sorts routes correctly', () => {
  const { routes } = create('sorting');

  assert.equal(
    routes.map((p) => p.component),
    [
      'sorting/index.astro',
      'sorting/about.astro',
      'sorting/post/index.astro',
      'sorting/post/bar.astro',
      'sorting/post/foo.astro',
      'sorting/post/f[xx].astro',
      'sorting/post/f[yy].astro',
      'sorting/post/[id].astro',
      'sorting/[wildcard].astro',
      'sorting/[...rest]/deep/[...deep_rest]/xyz.astro',
      'sorting/[...rest]/deep/[...deep_rest]/index.astro',
      'sorting/[...rest]/deep/index.astro',
      'sorting/[...rest]/abc.astro',
      'sorting/[...rest]/index.astro',
    ]
  );
});

test.run();
