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

If any of this sounds interesting, I hope you consider getting involved with Astro. Come say hi in the **#new-contributors** channel on Discord, anytime. We're always around and value contributions of any shape/size.

# Contributor Manual

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

## Translations

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
