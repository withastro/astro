# `create-astro`

`create-astro` is the fastest way to start a new Astro project from scratch. It will walk you through every step of setting up your new Astro project. It allows you to choose from a few different starter templates or provide your own using the `--template` argument.

## Interactive Mode

Run the following command in your terminal to start our handy install wizard in interactive mode.

```bash
# create a new project with npm
npm create astro@latest
```

```bash
# create a new project with pnpm
pnpm create astro@latest
```

```bash
# create a new project with yarn
yarn create astro
```

You can run `create-astro` anywhere on your machine, so there’s no need to create a new empty directory for your project before you begin. If you don’t have an empty directory yet for your new project, the wizard will help create one for you automatically.

## Advanced Usage

`create-astro` supports some handy CLI arguments for advanced users.

### Directory

The first argument will be treated as your target directory.

```bash
# create a new project in a new `my-project/` directory
npm create astro@latest my-project
```

### Template

The `--template` flag can be passed to specify any [official starter template](https://github.com/withastro/astro/tree/main/examples) available on GitHub.

```bash
# create a new project from the `minimal` starter template
npm create astro@latest --template minimal
```

Any GitHub repo can be used as a template, following the `user/repo` format.

```bash
npm create astro@latest --template mayank99/astro-minimal-starter
```

### Yes

The `--yes` (or `-y`) flag can be used to bypass any confirmation prompts and proceed with the default answer.

```bash
npm create astro@latest -y
```

Combined with the above directory and template arguments, `create-astro` becomes fully non-interactive for a super quick start.

```bash
npm create astro@latest my-project --template minimal -y
```

### Dry Run

Just looking to get the hang of `create-astro`? You can pass the `--dry-run` flag to ensure no files will be created.

```bash
npm create astro@latest --dry-run
```

### Install

Dependency installation can be controlled with the `--install` or `--no-install` flags to bypass the installation prompt.

```bash
npm create astro@latest --install
```

### Git

Git initialization can be controlled with the `--git` or `--no-git` flags to bypass the git prompt.

```bash
npm create astro@latest --git
```

### TypeScript

TypeScript customization can be controlled with the `--typescript` flag. Valid options are `strict`, `strictest`, and `relaxed`.

```bash
npm create astro@latest --typescript strictest
```

## Acknowledgements

- Huge thanks to [`giget`](https://github.com/unjs/giget) for handling template downloads!
