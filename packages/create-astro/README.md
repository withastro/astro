# create-astro

## Scaffolding for Astro projects

**With NPM:**

```bash
npm init astro
```

**With Yarn:**

```bash
yarn create astro
```

`create-astro` automatically runs in _interactive_ mode, but you can also specify your project name and template with command line arguments.

```bash
# npm 6.x
npm init astro my-astro-project --template starter

# npm 7+, extra double-dash is needed:
npm init astro my-astro-project -- --template starter

# yarn
yarn create astro my-astro-project --template starter
```
[Check out the full list][examples] of example starter templates, available on GitHub.

You can also use any GitHub repo as a template:

```bash
npm init astro my-astro-project -- --template cassidoo/shopify-react-astro
```

### CLI Flags

May be provided in place of prompts

| Name         | Description                                         |
|:-------------|:----------------------------------------------------|
| `--template` | Specify the template name ([list][examples])        |
| `--commit`   | Specify a specific Git commit or branch to use from this repo (by default, `main` branch of this repo will be used) |

### Debugging

To debug `create-astro`, you can use the `--verbose` flag which will log the output of degit and some more information about the command, this can be useful when you encounter an error and want to report it.

```bash
# npm 6.x
npm init astro my-astro-project --verbose

# npm 7+, extra double-dash is needed:
npm init astro my-astro-project -- --verbose

# yarn
yarn create astro my-astro-project --verbose
```

[examples]: https://github.com/withastro/astro/tree/main/examples
