# Contributing

We welcome contributions of any size and skill level. As an open source project, we believe in giving back to our contributors and are happy to help with guidance on PRs, technical writing, and turning any feature idea into a reality.

## Why contribute to open source?

[**@FredKSchott:**](https://twitter.com/FredKSchott) As a personal story - I got started in open source by randomly contributing to an npm package named `request`. At the time, the package was the third-most-used package on npm and was receiving millions of downloads a week. It was all maintained by one person and a couple of in-and-out contributors.

Thanks to a combination of free time, hard work and luck I was able to contribute and eventually become a lead maintainer of the project. For a long time I was one of 3 people in the world who could deploy some code (`npm publish request`) that would get immediately picked up by almost every Node.js project on the planet via `npm install`. It was exciting and a bit scary 😅.

At the same time, I had a day job where I was a junior software developer at a random tech co. I was surrounded by interesting projects, but I mostly did busy work. I had asked my manager if I could go up for a promotion and he said no. At least they paid me!

The Astro community is my personal attempt to share this experience with others who might be looking for the same thing as I was. Everyone is at different stages in their life and career, and my personal experience as "slightly bored junior developer" isn't a one-size-fits-all for why you should get involved in open source. Instead, here are some of my favorite things that I got out of open source development that I think apply to anyone:

- **Job opportunities:** Having the line "maintains code used by millions of developers" on my resume was an incredible way to stand out in every single job search I did for years afterwards.
- **Instant dev cred:** I was accepted to give my first public talk at a conference based solely on my open source work. It was a terrible talk, but who's first talk is good!? :D
- **Leadership/mentorship opportunities:** I went from having zero responsibility at work to being a respected voice/opinion in the `request` GitHub issues and PRs.
- **Learning from smart people:** I got to meet and learn from so many smart people across the open source ecosystem.
- **preventing imposter syndrome:** Sure, I was still just a kid, but having an actual human connection to developers who I looked up to at the time helped dispell the idea that "oh, **I** could never be like that."
- **Making friends in the larger community:** The creator of request, [@mikeal](https://twitter.com/mikeal), is still a friend to this day.

If any of this sounds interesting, I hope you consider getting involved with Astro. Come say hi in the [**#new-contributors**](https://astro.build/chat) channel on Discord, anytime. We're always around and value contributions of any shape/size.

# Contributor Manual

## Prerequisite

```shell
node: "^12.20.0 || ^14.13.1 || >=16.0.0"
yarn: "^1.22.10"
# otherwise, your build will fail
```

## Setting up your local repo

Astro uses yarn workspaces, so you should **always run `yarn install` from the top-level project directory.** running `yarn install` in the top-level project root will install dependencies for `astro`, `www`, `docs`, and every package in the repo.

```shell
git clone && cd ...
yarn install
yarn build:all
```

## Development

```shell
# starts a file-watching, live-reloading dev script for active development
yarn dev
# build the entire project, one time.
yarn build
```

## Running tests

```shell
# run this in the top-level project root to run all tests
yarn test
# run only a few tests, great for working on a single feature
# (example - `yarn test rss` runs `astro-rss.test.js` tests)
yarn test $STRING_MATCH
```

## Other useful commands

```shell
# auto-format the entire project
# (optional - a GitHub Action formats every commit after a PR is merged)
yarn format
```

```shell
# lint the project
# (optional - our linter creates helpful warnings, but not errors.)
yarn lint
```

## Making a Pull Request

When making a pull request, be sure to add a changeset when something has changed with Astro. Non-packages (`examples/*`, `docs/*`, and `www/*`) do not need changesets.

```shell
yarn changeset
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

# Releasing Astro

_Note: Only priviledged contributors (L3+) can release new versions of Astro._

The repo is set up with automatic releases, using the changeset GitHub action & bot.

To release a new version of Astro, find the `Version Packages` PR, read it over, and merge it.

## Releasing PR preview snapshots

Our release tool `changeset` has a feature for releasing "snapshot" releases from a PR or custom branch. These are npm package publishes that live temporarily, so that you can give users a way to test a PR before merging. This can be a great way to get early user feedback while still in the PR review process.

To release a snapshot, run the following locally:

```shell
# Note: XXX should be a keyword to identify this release. Ex: `--snapshot routing` & `--tag next--routing`

# 1:
yarn changeset version --snapshot XXX
# 2: (Manual) review the diff, and make sure that you're not releasing more than you need to.
git checkout -- examples/ docs/ www/
# 3:
yarn release --tag next--XXX
```

Full documentation: https://github.com/atlassian/changesets/blob/main/docs/snapshot-releases.md

## Releasing `astro@next` (aka "prerelease mode")

Sometimes, the repo enters "prerelease mode", which means that `main` is no longer releasing to `npm install astro` but is instead releasing to `npm install astro@next`. We do this from time-to-time to test large features before sharing them with the larger Astro audience.

When in prerelease mode, the automatic PR release process is for `next`. That means that releasing to `latest` becomes a manual process. To release latest manually while in prerelease mode:

1. _In the code snippets below, replace `0.X` with your version (ex: `0.18`, `release/0.18`, etc.)._
1. Create a new `release/0.X` branch, if none exists.
1. Point `release/0.X` to the latest commit for the `v0.X` version.
1. `git cherry-pick` commits from `main`, as needed.
1. Make sure that all changesets for the new release are included. You can create some manually (via `yarn changeset`) if needed.
1. Run `yarn changeset version` to create your new release.
1. Run `yarn release` to publish your new release.
1. Run `git push && git push --tags` to push your new release to GitHub.
1. Run `git push release/0.X:latest` to push your release branch to `latest`. This will trigger an update to the docs site, the www site, etc.
1. Go to https://github.com/snowpackjs/astro/releases/new and create a new release. Copy the new changelog entry from https://github.com/snowpackjs/astro/blob/latest/packages/astro/CHANGELOG.md.
1. Post in Discord #announcements channel, if needed!

Full documentation: https://github.com/atlassian/changesets/blob/main/docs/snapshot-releases.md

### Entering prerelease mode

If you have gotten permission from the core contributors, you can enter into prerelease mode by following the following steps:

- Run: `yarn changeset pre enter next` in the project root
- Create a new PR from the changes created by this command
- Review, approve, and more the PR to enter prerelease mode.
- If successful, The "Version Packages" PR (if one exists) will now say "Version Packages (next)".

### Exiting prerelease mode

Exiting prerelease mode should happen once an experimental release is ready to go from `npm install astro@next` to `npm install astro`. Only a core contributor run these steps. These steps should be run before

- Run: `yarn changeset pre enter next` in the project root
- Create a new PR from the changes created by this command.
- Review, approve, and more the PR to enter prerelease mode.
- If successful, The "Version Packages (next)" PR (if one exists) will now say "Version Packages".

# Translations

Help us translate [docs.astro.build](https://docs.astro.build/) into as many languages as possible! This can be a great way to get involved with open source development without having to code.

Our translation process is loosly based off of [MDN.](https://hacks.mozilla.org/2020/12/an-update-on-mdn-web-docs-localization-strategy/)

### Important: Beta Status

Astro is changing quickly, and so are the docs. We cannot translate too many pages until Astro is closer to a v1.0.0 release candidate. **To start, do not translate more than the "getting started" page.** Once we are closer to a v1.0.0 release candidate, we will begin translating all pages.

### Tier 1: Priority Languages

**Tier 1** languages are considered a top priority for Astro documentation. The docs site should be fully translated into these languages, and reasonably kept up-to-date:

- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- French (fr)
- Japanese (ja)

We are always looking for people to help us with these translations. If you are interested in getting involved, please [reach out to us](https://astro.build/chat) on Discord in the `i18n` channel.

### Tier 2 Languages

All other languages are considered **Tier 2**. Tier 2 language translations are driven by the community, with support from core maintainers. If you want to see the Astro docs site translated into a new language, then we need your help to kick off the project!

If you are interested in getting involved, please [reach out to us](https://astro.build/chat) on Discord in the `i18n` channel.
