# create-astro

## Scaffolding for Astro projects

**With NPM:**

```bash
npm create astro@latest
```

**With Yarn:**

```bash
yarn create astro
```

**With PNPM:**

```bash
pnpm create astro
```

`create-astro` automatically runs in _interactive_ mode, but you can also specify your project name and template with command line arguments.

```bash
# npm
npm create astro@latest my-astro-project -- --template minimal

# yarn
yarn create astro my-astro-project --template minimal

# pnpm
pnpm create astro my-astro-project --template minimal
```

[Check out the full list][examples] of example templates, available on GitHub.

You can also use any GitHub repo as a template:

```bash
npm create astro@latest my-astro-project -- --template cassidoo/shopify-react-astro
```

### CLI Flags

May be provided in place of prompts

| Name                       | Description                                                |
| :------------------------- | :--------------------------------------------------------- |
| `--help (-h)`              | Display available flags.                                   |
| `--template <name>`        | Specify a template.                                        |
| `--install / --no-install` | Toggle dependency installation.                            |
| `--git / --no-git`         | Toggle git repository initialization.                      |
| `--yes (-y)`               | Accept all default prompts.                                |
| `--no (-n)`                | Decline all default prompts.                               |
| `--dry-run`                | Simulate steps without actual execution.                   |
| `--skip-houston`           | Skip the Houston animation.                                |
| `--ref`                    | Specify an Astro branch (default: latest).                 |
| `--fancy`                  | Enable full Unicode support for Windows.                   |
| `--typescript <option>`    | Choose a TypeScript option: `strict`, `strictest`, `relaxed`. |

[examples]: https://github.com/withastro/astro/tree/main/examples
[typescript]: https://github.com/withastro/astro/tree/main/packages/astro/tsconfigs
