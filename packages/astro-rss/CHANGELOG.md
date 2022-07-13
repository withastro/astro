# @astrojs/rss

## 0.2.0

### Minor Changes

- [#3301](https://github.com/withastro/astro/pull/3301) [`0efaf110`](https://github.com/withastro/astro/commit/0efaf110fceba149cd41cbaa0f37311e6887cdec) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Change the optional "canonicalUrl" argument to a required "site" argument. This fixes problems with import.meta.env.SITE. If you want to use your project's "site" field for your RSS feeds, set site: import.meta.env.SITE in the rss function options

## 0.1.1

### Patch Changes

- [`1032e450`](https://github.com/withastro/astro/commit/1032e450cc224e603e8e69ef1422de6dbf184dd2) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Introduce new @astrojs/rss package for RSS feed generation! This also adds a new global env variable for your project's configured "site": import.meta.env.SITE. This is consumed by the RSS feed helper to generate the correct canonical URL.
