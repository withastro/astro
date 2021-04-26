---
layout: ../../layouts/content.astro
title: JavaScript API
description: Snowpack's JavaScript API is for anyone who wants to integrate with some custom build pipeline or server-side rendering engine.
---

Most users will interact with Snowpack via the [command-line](/reference/cli-command-line-interface) interface (CLI). However, Snowpack also ships a JavaScript API for anyone to build on top of.

This page contains reference information on Snowpack's public API and all related data types. A full set of all data types defined within the project (public and private) can be found in [the package's `types.d.ts` file](https://unpkg.com/browse/snowpack@3.0.10/lib/types.d.ts).

### createConfiguration()

`createConfiguration(config?: SnowpackUserConfig) => SnowpackConfig`

```js
import {createConfiguration} from 'snowpack';
const config = createConfiguration({...});
```

Almost everything that you do with Snowpack requires a configuration object. Snowpack is designed to work with zero config, and the `config` argument that this function takes can be full, empty, or only contain a couple of properties. The rest of the configuration object will be filled out with Snowpack's usual set of defaults, outlined in our [snowpack.config.js documentation.](/reference/configuration).

The easiest way to think about the difference is that `SnowpackUserConfig` is the externally-documented configuration format, and `SnowpackConfig` is our internal representation with all optional/undefined values populated with the actual defaults.

### loadConfiguration()

`loadConfiguration(overrides?: SnowpackUserConfig, configPath?: string | undefined) => Promise<SnowpackConfig>`

```js
import {loadConfiguration} from 'snowpack';
const config = loadConfiguration({...}, '/path/to/snowpack.config.js');
```

Similar to `createConfiguration`, but this function will actually check the file system to load a configuration file from disk.

All paths within that configuration file are relative to the file itself.

### startServer()

`function startServer({config: SnowpackUserConfig}) => Promise<SnowpackDevServer>`

```js
import {startServer} from 'snowpack';
const config = createConfiguration({...});
const server = await startServer({config}); // returns: SnowpackDevServer
```

Start a new Snowpack dev server instance. This is the equivalent of running `snowpack dev` on the command line.

Once started, you can load files from your dev server and Snowpack will build them as requested. This is an important feature to understand: Snowpack's dev server does zero file building on startup, and instead builds files only once they are requested via the server's `loadUrl` method.

### SnowpackDevServer

#### SnowpackDevServer.port

The port that the server is listening on.

#### SnowpackDevServer.loadUrl()

`loadUrl(reqUrl: string, opt?: {isSSR?: boolean; allowStale?: boolean; encoding?: string}): Promise<LoadResult<Buffer | string>>;`

```ts
const server = await startServer({config});
const {contents} = server.loadUrl('/dist/index.js', {...});
```

Load a file and return the result. On the first request of a URL, this will kick off a build that will then be cached for all future requests during the life of the server.

You can pass `allowStale: true` to enable Snowpack's cold cache for cached results from past sessions. However, Snowpack provides no guarentee on the freshness of the cold-cache data.

#### SnowpackDevServer.getUrlForFile()

`getUrlForFile(fileLoc: string) => string | null;`

```ts
const server = await startServer({config});
const fileUrl = server.getUrlForFile('/path/to/index.jsx');
const {contents} = server.loadUrl(fileUrl, {...});
```

A helper function to find the final hosted URL for any source file. Useful when combined with `loadUrl`, since you may only know a file's location on disk without knowing it's final hosted URL.

#### SnowpackDevServer.sendResponseError()

`sendResponseError(req: http.IncomingMessage, res: http.ServerResponse, status: number) => void;`

A helper function to send an error response in a server response handler. Useful when integrating Snowpack with Express, Koa, or any other Node.js server.

#### SnowpackDevServer.onFileChange()

`onFileChange({filePath: string}) => void;`

Listen for watched file change events. Useful for situations where you might want to watch the file system for changes yourself, and can save overhead/performance by hooking into our already-running watcher.

#### SnowpackDevServer.shutdown()

`shutdown() => Promise<void>;`

```ts
const server = await startServer({ config });
await server.shutdown();
```

Shut down the Snowpack dev server. Cleanup any long-running commands, file watchers, etc.

#### SnowpackDevServer.getServerRuntime()

`getServerRuntime({invalidateOnChange?: boolean}) => ServerRuntime;`

```ts
const server = await startServer({ config });
const runtime = server.getServerRuntime();
const { helloWorld } = (await runtime.importModule('/dist/index.js')).exports;
helloWorld();
```

Returns an ESM Server Runtime that lets Node.js import modules directly out of Snowpack's build cache. Useful for SSR, test running frontend code, and the overall unification of your build pipeline.

For more information, check out our guide on [Server-Side Rendering](/guides/server-side-render) using the `getServerRuntime()` API.

#### ServerRuntime

```ts
interface ServerRuntime {
  /** Import a Snowpack-build JavaScript file into Node.js. */
  importModule(url: string) => Promise<ServerRuntimeModule>;
  /** Invalidate a module in the internal runtime cache. */
  invalidateModule(url: string) => void;
}
```

#### ServerRuntimeModule

```ts
interface ServerRuntimeModule {
  /** The imported module. */
  exports: any;
  /** References to all internal CSS imports. Useful for CSS extraction. */
  css: string[];
}
```

### build()

`build({config: SnowpackUserConfig}) => Promise<SnowpackBuildResult>`

```js
import {build} from 'snowpack';
const config = createConfiguration({...});
const {result} = await build({config}); // returns: SnowpackBuildResult
```

#### SnowpackBuildResult.result

An in-memory manifest of all build inputs & output files.

#### SnowpackBuildResult.shutdown

In `--watch` mode, the `build()` function will resolve but the build itself will continue. Use this function to shut down the build watcher.

In normal build mode (non-watch mode) this function will throw with a warning.

#### SnowpackBuildResult.onFileChange

In `--watch` mode, the `build()` function will resolve but the build itself will continue. Use this function to respond to file change events without having to spin up your own file watcher.

In normal build mode (non-watch mode) this function will throw with a warning.

### getUrlForFile()

`getUrlForFile(fileLoc: string, config: SnowpackConfig) => string | null`

```js
import { getUrlForFile } from 'snowpack';
const fileUrl = getUrlForFile('/path/to/file.js', config);
```

A helper function to find the final hosted URL for any source file. Useful when combined with `loadUrl`, since you may only know a file's location on disk without knowing it's final hosted URL.

Similar to `SnowpackDevServer.getUrlForFile()`, but requires a second `config` argument to inform the result.

### clearCache()

`clearCache() => Promise<void>`

```js
import { clearCache } from 'snowpack';
await clearCache();
```

Equivalent of using the `--reload` flag with the `snowpack` CLI. Clears all cached data in Snowpack. Useful for troubleshooting, or clearing the cache after making some change that Snowpack couldn't detect.

### logger

```js
import { logger } from 'snowpack';
```

You can control Snowpack's internal logger directly by importing it. Note that this is an advanced feature not needed for most users. Instead, use the `verbose` config option to enable debug logging and control log message verbosity.
