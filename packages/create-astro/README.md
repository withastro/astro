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
npm init astro my-astro-project --template blank

# npm 7+, extra double-dash is needed:
npm init astro my-astro-project -- --template blank

# yarn
yarn create astro my-astro-project --template blank
```

To see all available options, use the `--help` flag.

### Templates

The following templates are included:

- `starter`
- `blank`

Feel free to [open a PR](https://github.com/snowpackjs/astro/pulls) to add additional templates.
