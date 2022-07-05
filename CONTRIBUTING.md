# Contributor Manual

We welcome contributions of any size and skill level. As an open source project, we believe in giving back to our contributors and are happy to help with guidance on PRs, technical writing, and turning any feature idea into a reality.

> **Tip for new contributors:**
> Take a look at [https://github.com/firstcontributions/first-contributions](https://github.com/firstcontributions/first-contributions) for helpful information on contributing

## Quick Guide

### Prerequisite

```shell
node: "^14.15.0 || >=16.0.0"
pnpm: "^7.5.0"
# otherwise, your build will fail
```

### Setting up your local repo

Astro uses pnpm workspaces, so you should **always run `pnpm install` from the top-level project directory.** running `pnpm install` in the top-level project root will install dependencies for `astro`, and every package in the repo.

```shell
git clone && cd ...
pnpm install
pnpm run build
```

In [#2254](https://github.com/withastro/astro/pull/2254) a `.git-blame-ignore-revs` file was added to ignore repo-wide formatting changes. To improve your experience, you should run the following command locally.

```shell
git config --local blame.ignoreRevsFile .git-blame-ignore-revs
```

### Development

```shell
# starts a file-watching, live-reloading dev script for active development
pnpm run dev
# build the entire project, one time.
pnpm run build
```

#### Debugging Vite

You can debug vite by prefixing any command with `DEBUG` like so:

```
DEBUG=vite:* astro dev        # debug everything in Vite
DEBUG=vite:[name] astro dev   # debug specific process, e.g. "vite:deps" or "vite:transform"
```

### Running tests

```shell
# run this in the top-level project root to run all tests
pnpm run test
# run only a few tests, great for working on a single feature
# (example - `pnpm run test:match "RSS"` runs `astro-rss.test.js`)
pnpm run test:match "$STRING_MATCH"
```

#### E2E tests

Certain features, like HMR and client hydration, need end-to-end tests to verify functionality in the dev server. [Playwright](https://playwright.dev/) is used to test against the dev server.

```shell
# run this in the top-level project root to run all E2E tests
pnpm run test:e2e
# run only a few tests, great for working on a single feature
# (example - `pnpm run test:e2e:match "Tailwind CSS" runs `tailwindcss.test.js`)
pnpm run test:e2e:match "$STRING_MATCH"
```

**When should you add E2E tests?**

Any tests for `astro build` output should use the main `mocha` tests rather than E2E - these tests will run faster than having Playwright start the `astro preview` server.

If a test needs to validate what happens on the page after it's loading in the browser, that's a perfect use for E2E dev server tests, i.e. to verify that hot-module reloading works in `astro dev` or that components were client hydrated and are interactive.

### Other useful commands

```shell
# auto-format the entire project
# (optional - a GitHub Action formats every commit after a PR is merged)
pnpm run format
```

```shell
# lint the project
# (optional - our linter creates helpful warnings, but not errors.)
pnpm run lint
```

### Making a Pull Request

When making a pull request, be sure to add a changeset when something has changed with Astro. Non-packages (`examples/*`) do not need changesets.

```shell
pnpm exec changeset
```

### Running benchmarks

We have benchmarks to keep performance under control. You can run these by running (from the project root):

```shell
pnpm run benchmark --filter astro
```

Which will fail if the performance has regressed by **10%** or more.

To update the times cd into the `packages/astro` folder and run the following:

```shell
node test/benchmark/build.bench.js --save
node test/benchmark/dev.bench.js --save
```

Which will update the build and dev benchmarks.

## Code Structure

Server-side rendering (SSR) can be complicated. The Astro package (`packages/astro`) is structured in a way to help think about the different systems.

- `components/`: Built-in components to use in your project (e.g. `import Code from 'astro/components/Code.astro'`)
- `src/`: Astro source
  - `@types/`: TypeScript types. These are centralized to cut down on circular dependencies
  - `cli/`: Code that powers the `astro` CLI command
  - `core/`: Code that executes **in the top-level scope** (in Node). Within, you’ll find code that powers the `astro build` and `astro dev` commands, as well as top-level SSR code.
  - `runtime/`: Code that executes **in different scopes** (i.e. not in a pure Node context). You’ll have to think about code differently here.
    - `client/`: Code that executes **in the browser.** Astro’s partial hydration code lives here, and only browser-compatible code can be used.
    - `server/`: Code that executes **inside Vite’s SSR.** Though this is a Node environment inside, this will be executed independently from `core/` and may have to be structured differently.
  - `vite-plugin-*/`: Any Vite plugins that Astro needs to run. For the most part, these also execute within Vite similar to `src/runtime/server/`, but it’s also helpful to think about them as independent modules. _Note: at the moment these are internal while they’re in development_

### Thinking about SSR

There are 3 contexts in which code executes:

- **Node.js**: this code lives in `src/core/`.
- **Inside Vite**: this code lives in `src/runtime/server/`.
- **In the browser**: this code lives in `src/runtime/client/`.

Understanding in which environment code runs, and at which stage in the process, can help clarify thinking about what Astro is doing. It also helps with debugging, for instance, if you’re working within `src/core/`, you know that your code isn’t executing within Vite, so you don’t have to debug Vite’s setup. But you will have to debug vite inside `runtime/server/`.

## Releasing Astro

_Note: Only [core maintainers (L3+)](https://github.com/withastro/astro/blob/main/GOVERNANCE.md#level-3-l3---core-maintainer) can release new versions of Astro._

The repo is set up with automatic releases, using the changeset GitHub action & bot.

To release a new version of Astro, find the `Version Packages` PR, read it over, and merge it.

### Releasing PR preview snapshots

Our release tool `changeset` has a feature for releasing "snapshot" releases from a PR or custom branch. These are npm package publishes that live temporarily, so that you can give users a way to test a PR before merging. This can be a great way to get early user feedback while still in the PR review process.

To release a snapshot, run the following locally:

```shell
# Note: XXX should be a keyword to identify this release. Ex: `--snapshot routing` & `--tag next--routing`

# 1:
pnpm exec changeset version --snapshot XXX
# 2: (Manual) review the diff, and make sure that you're not releasing more than you need to.
git checkout -- examples/
# 3:
pnpm run release --tag next--XXX
# 4: (Manual) review the publish, and if you're happy then you can throw out all local changes
git reset --hard
```

Full documentation: https://github.com/atlassian/changesets/blob/main/docs/snapshot-releases.md

### Releasing `astro@next` (aka "prerelease mode")

Sometimes, the repo will enter into "prerelease mode". In prerelease mode, our normal release process will publish npm versions under the `next` dist-tag, instead of the default `latest` tag. We do this from time-to-time to test large features before sharing them with the larger Astro audience.

While in prerelease mode, follow the normal release process to release `astro@next` instead of `astro@latest`. To release `astro@latest` instead, see [Releasing `astro@latest` while in prerelease mode](#user-content-releasing-astrolatest-while-in-prerelease-mode).

Full documentation: https://github.com/atlassian/changesets/blob/main/docs/prereleases.md

### Entering prerelease mode

If you have gotten permission from the core contributors, you can enter into prerelease mode by following the following steps:

- Run: `pnpm exec changeset pre enter next` in the project root
- Create a new PR from the changes created by this command
- Review, approve, and more the PR to enter prerelease mode.
- If successful, The "Version Packages" PR (if one exists) will now say "Version Packages (next)".

### Exiting prerelease mode

Exiting prerelease mode should happen once an experimental release is ready to go from `npm install astro@next` to `npm install astro`. Only a core contributor run these steps. These steps should be run before

- Run: `pnpm exec changeset pre exit` in the project root
- Create a new PR from the changes created by this command.
- Review, approve, and more the PR to enter prerelease mode.
- If successful, The "Version Packages (next)" PR (if one exists) will now say "Version Packages".

### Releasing `astro@latest` while in prerelease mode

When in prerelease mode, the automatic PR release process will no longer release `astro@latest`, and will instead release `astro@next`. That means that releasing to `latest` becomes a manual process. To release latest manually while in prerelease mode:

1. _In the code snippets below, replace `0.X` with your version (ex: `0.18`, `release/0.18`, etc.)._
1. Create a new `release/0.X` branch, if none exists.
1. Point `release/0.X` to the latest commit for the `v0.X` version.
1. `git cherry-pick` commits from `main`, as needed.
1. Make sure that all changesets for the new release are included. You can create some manually (via `pnpm exec changeset`) if needed.
1. Run `pnpm exec changeset version` to create your new release.
1. Run `pnpm exec release` to publish your new release.
1. Run `git push && git push --tags` to push your new release to GitHub.
1. Run `git push release/0.X:latest` to push your release branch to `latest`.
1. Go to https://github.com/withastro/astro/releases/new and create a new release. Copy the new changelog entry from https://github.com/withastro/astro/blob/latest/packages/astro/CHANGELOG.md.
1. Post in Discord #announcements channel, if needed!

## Documentation

Help us make [docs.astro.build](https://docs.astro.build/) as accurate and easy-to-use as possible. Contributing to documentation can be a great way to get involved with open source development without having to code.

Head over to [the `withastro/docs` repo](https://github.com/withastro/docs) to get involved!
