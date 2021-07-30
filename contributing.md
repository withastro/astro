# Contributing

## Prerequisite

```shell
node: "^12.20.0 || ^14.13.1 || >=16.0.0"
yarn: "^1.22.10"
# otherwise, build will fail
```

## Setting Up the Monorepo

```shell
# git clone && cd ...
yarn install
yarn build
```

Most of the packages have a dev script that will recompile when a file changes. For example when working on the `astro` package you can run:

```shell
yarn workspace astro run dev
```

## Making Pull Requests

When making a pull request, add a changeset which helps with releases.

```shell
yarn changeset
```

This will prompt you asking what type of change was made.

## Releases

For those contributors that have access to publish to npm, the following is how you do releases.

From the `main` branch do a pull, install and build:

```shell
git pull origin main
yarn install
yarn build
```

Then bump the versions:

```shell
yarn changeset version
```

This should change package.json bumping version numbers and update changelogs. Inspect these to make sure they are what you expect.

Commit and push these changes, then run an npm publish for each of the packages that have changed.

> **Important**! Ordering publishes can be important. If `@astrojs/parser` changes you should publish that before `astro`, for example.

```shell
cd packages/astro
npm publish
```

## Running benchmarks

We have benchmarks to keep performance under control. You can run these by running (from the project root):

```shell
yarn workspace astro run benchmark
```

Which will fail if the performance has regressed by **10%** or more.

To update the times cd into the `packages/astro` folder and run the following:

```shell
node test/benchmark/build.bench.js --save
node test/benchmark/dev.bench.js --save
```

Which will update the build and dev benchmarks.
