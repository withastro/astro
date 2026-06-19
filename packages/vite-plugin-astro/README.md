# vite-plugin-astro

A [Vite](https://vite.dev) plugin that compiles [Astro](https://astro.build) (`.astro`) files to JavaScript.

This is the low-level plugin that powers Astro's own build pipeline. It takes care of turning `.astro` components into server-renderable JavaScript modules, extracting their scoped styles and scripts into virtual modules, and wiring up hot module replacement during development.

> [!IMPORTANT]
> This is a building block, not an application framework. If you want to build a website with Astro, install [`astro`](https://www.npmjs.com/package/astro) instead — it already includes and configures this plugin for you.
>
> Reach for `vite-plugin-astro` only if you are building a tool, framework, or custom Vite setup that needs to compile `.astro` files on its own. The compiled output still depends on a server runtime.

## Installation

```sh
npm install vite-plugin-astro
# or
pnpm add vite-plugin-astro
# or
yarn add vite-plugin-astro
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite';
import astro from 'vite-plugin-astro';

export default defineConfig({
  plugins: [
    astro({
      transformOptions: {
        // Options forwarded to the Astro compiler (see below).
      },
    }),
  ],
});
```

Once registered, importing a `.astro` file returns its compiled component module:

```js
import Layout from './Layout.astro';
```

In the `client` environment, importing a `.astro` file resolves to an empty module instead — Astro components render on the server and cannot run in the browser. In development, importing one on the client throws a helpful error at runtime.

## Options

```ts
astro({
  transformOptions, // required
  transform, // optional
  handleError, // optional
});
```

### `transformOptions`

Type: `ExposedTransformOptions` **(required)**

Options forwarded to the underlying Astro compiler ([`@astrojs/compiler-rs`](https://www.npmjs.com/package/@astrojs/compiler-rs)) for every `.astro` file. This is the compiler's `TransformOptions` minus the fields the plugin sets for you (`filename`, `normalizedFilename`, `preprocessedStyles`, and `resolvePath`).

### `transform`

Type: `(filename: string, code: string) => string`

An optional hook to post-process the JavaScript produced by the compiler, before Vite consumes it. Receives the file name and the compiled code, and returns the (possibly modified) code.

```js
astro({
  transformOptions: {},
  transform(filename, code) {
    // e.g. inject or rewrite the compiled output
    return code;
  },
});
```

### `handleError`

Type: `(error: CompilerError | CSSError | AggregateError) => Error`

An optional hook to convert a compiler or CSS error into the `Error` that gets thrown. Defaults to a built-in handler that produces `Error` instances with names like `CompilerError`, `CSSError`, `CSSSyntaxError`, or an `AggregateError` for multiple CSS errors.

Use it to customize error formatting, attach extra context, or integrate with your own diagnostics:

```js
astro({
  transformOptions: {},
  handleError(error) {
    if (error.type === 'compiler') {
      return new Error(`Failed to compile ${error.location.file}: ${error.message}`);
    }
    // fall back to a basic error for css/aggregate
    return new Error(error.type);
  },
});
```

## Reading component metadata

During compilation the plugin attaches Astro-specific metadata to each module's Vite `meta` object under the `astro` key. This includes hydrated components, `client:only` components, server components, hoisted scripts, whether the module contains a `<head>`, and style/script propagation hints.

Use `getAstroMetadata` to read it from a Vite `ModuleInfo`, and `createDefaultAstroMetadata` to produce an empty metadata object (useful when synthesizing virtual `.astro`-like modules):

```ts
import { getAstroMetadata, createDefaultAstroMetadata } from 'vite-plugin-astro';

// inside a Vite plugin hook:
const meta = getAstroMetadata(this.getModuleInfo(id));
if (meta) {
  meta.hydratedComponents; // Component[]
  meta.clientOnlyComponents;
  meta.scripts;
  meta.containsHead; // boolean
  meta.propagation; // 'none' | 'self' | 'in-tree'
}

const empty = createDefaultAstroMetadata();
```

```ts
interface AstroPluginMetadata {
  astro: {
    hydratedComponents: Component[];
    clientOnlyComponents: Component[];
    serverComponents: Component[];
    scripts: HoistedScript[];
    containsHead: boolean;
    propagation: 'none' | 'self' | 'in-tree';
    pageOptions: { prerender?: boolean };
  };
}
```

## How it works

The factory returns several cooperating Vite plugins:

- **Compilation.** `.astro` files are transformed to server-renderable JS. The plugin runs with `enforce: 'pre'` so it processes `.astro` source before other plugins. Compiled metadata for each file is cached so its virtual modules can be served without recompiling.
- **Scoped styles and scripts.** A component's `<style>` and `<script>` blocks are extracted and served as separate virtual modules (e.g. `Component.astro?astro&type=style&index=0`). Scoped (non-global) styles use Vite's `cssScopeTo` so they can be tree-shaken when the component's default export is unused. In SSR/prerender environments, client scripts are emitted as empty stubs so they still appear in the module graph without running on the server.
- **Resolve condition.** The plugin appends an `astro` condition to `resolve.conditions` for every environment, so packages can ship Astro-specific entry points.
- **HMR.** Hot updates are handled by recompiling the changed file and comparing it against the cached source, propagating updates to dependent style and script modules. Deleted files are evicted from the compile cache automatically.

## License

MIT, see [LICENSE](https://github.com/withastro/astro/blob/main/LICENSE).
