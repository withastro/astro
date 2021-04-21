## 👩🏽‍💻 Command Line Interface

### Global Flags

#### `--config path`

Specify the path to the config file. Defaults to `astro.config.mjs`. Use this if you use a different name for your configuration file or have your config file in another folder.

```shell
astro --config config/astro.config.mjs dev
```

#### `--version`

Print the Astro version number and exit.

#### `--help`

Print the help message and exit.

### Commands

#### `astro dev`

Runs the Astro development server. This starts an HTTP server that responds to requests for pages stored in `astro/pages` (or which folder is specified in your [configuration](../README.md##%EF%B8%8F-configuration)).

__Flags__

##### `--port`

Specifies should port to run on. Defaults to `3000`.