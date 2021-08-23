import { fileURLToPath } from 'url';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createManifest } from '../dist/manifest/create.js';

const cwd = new URL('./fixtures/route-manifest/', import.meta.url);

const create = (dir, trailingSlash) => {
  return createManifest({
    config: {
      projectRoot: cwd,
      pages: new URL(dir, cwd),
      devOptions: {
        trailingSlash,
      },
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

test('creates routes with trailingSlashes = always', () => {
  const { routes } = create('basic', 'always');
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
      pattern: /^\/about\/$/,
      params: [],
      component: 'basic/about.astro',
      path: '/about',
    },

    {
      type: 'page',
      pattern: /^\/blog\/$/,
      params: [],
      component: 'basic/blog/index.astro',
      path: '/blog',
    },

    {
      type: 'page',
      pattern: /^\/blog\/([^/]+?)\/$/,
      params: ['slug'],
      component: 'basic/blog/[slug].astro',
      path: null,
    },
  ]);
});

test('creates routes with trailingSlashes = never', () => {
  const { routes } = create('basic', 'never');
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
      pattern: /^\/about$/,
      params: [],
      component: 'basic/about.astro',
      path: '/about',
    },

    {
      type: 'page',
      pattern: /^\/blog$/,
      params: [],
      component: 'basic/blog/index.astro',
      path: '/blog',
    },

    {
      type: 'page',
      pattern: /^\/blog\/([^/]+?)$/,
      params: ['slug'],
      component: 'basic/blog/[slug].astro',
      path: null,
    },
  ]);
});

test('creates routes with trailingSlashes = ignore', () => {
  const { routes } = create('basic', 'ignore');
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
  const { routes } = create('encoding', 'always');

  // had to remove ? and " because windows

  // const quote = 'encoding/".astro';
  const hash = 'encoding/#.astro';
  // const question_mark = 'encoding/?.astro';

  assert.equal(
    routes.map((p) => p.pattern),
    [
      // /^\/%22$/,
      /^\/%23\/$/,
      // /^\/%3F$/
    ]
  );
});

test('ignores files and directories with leading underscores', () => {
  const { routes } = create('hidden-underscore', 'always');

  assert.equal(routes.map((r) => r.component).filter(Boolean), ['hidden-underscore/index.astro', 'hidden-underscore/e/f/g/h.astro']);
});

test('ignores files and directories with leading dots except .well-known', () => {
  const { routes } = create('hidden-dot', 'always');

  assert.equal(routes.map((r) => r.component).filter(Boolean), ['hidden-dot/.well-known/dnt-policy.astro']);
});

test('fails if dynamic params are not separated', () => {
  assert.throws(() => {
    create('invalid-params', 'always');
  }, /Invalid route invalid-params\/\[foo\]\[bar\]\.astro — parameters must be separated/);
});

test('disallows rest parameters inside segments', () => {
  assert.throws(
    () => {
      create('invalid-rest', 'always');
    },
    /** @param {Error} e */
    (e) => {
      return e.message === 'Invalid route invalid-rest/foo-[...rest]-bar.astro — rest parameter must be a standalone segment';
    }
  );
});

test('ignores things that look like lockfiles', () => {
  const { routes } = create('lockfiles', 'always');
  assert.equal(cleanRoutes(routes), [
    {
      type: 'page',
      pattern: /^\/foo\/$/,
      params: [],
      component: 'lockfiles/foo.astro',
      path: '/foo',
    },
  ]);
});

test('allows multiple slugs', () => {
  const { routes } = create('multiple-slugs', 'always');

  assert.equal(cleanRoutes(routes), [
    {
      type: 'page',
      pattern: /^\/([^/]+?)\.([^/]+?)\/$/,
      component: 'multiple-slugs/[file].[ext].astro',
      params: ['file', 'ext'],
      path: null,
    },
  ]);
});

test('sorts routes correctly', () => {
  const { routes } = create('sorting', 'always');

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
