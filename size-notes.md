## `astro`

- Replace `mime` with `mrmime`
- Remove `path-browserify`
- Allow `minify` during build? ~10kB reduction for base

## `@astrojs/node`

- Replace `send` with `sirv`
- Better splitting/feature detection for `@astrojs/webapi`?
  - Alternatively, just drop it.
    - With Web API: `183 kB` gzip
    - Without Web API: `36.4 kB` gzip

## Dependencies By Size

- `mrmime`, `12 kB`
- `path-to-regexp`, `8.7 kB`
- `cookie`, `5.2 kB`
- `html-escaper`, `1.6 kB`
- `kleur`, `0.8 kB`

## Internal files by Size

- `runtime/server/render/component.js` 8.9 kB
- `core/render/result.js` 8.1 kB
- `core/app/index.js` 7.9 kB
- `core/errors/errors-data.js` 7.3 kB
- `runtime/server/jsx.js` 6.5 kB

Dev-time error messages are not being tree-shaken out!
