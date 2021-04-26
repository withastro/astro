---
layout: ../../layouts/content.astro
title: Command Line API
description: The Snowpack Command Line tool's API, commands, and flags.
---

### Commands

```
$ snowpack --help

snowpack init         Create a new project config file.
snowpack dev          Develop your app locally.
snowpack build        Build your app for production.

...
```

### Flags

```bash
# Show helpful info
$ snowpack --help

# Show additional debugging logs
$ snowpack --verbose

# {devOptions: {open: 'none'}}
$ snowpack dev --open none

# {buildOptions: {clean: true/false}}
$ snowpack build --clean
$ snowpack build --no-clean
```

**CLI flags will be merged with (and take priority over) your config file values.** Every config value outlined below can also be passed as a CLI flag. Additionally, Snowpack also supports the following flags:

- **`--config [path]`** Set the path to your project config file.
- **`--help`** Show this help.
- **`--version`** Show the current version.
- **`--reload`** Clear the local cache. Useful for troubleshooting installer issues.
