# @astrojs/ts-content-mapper

A [TypeScript content mapper](https://github.com/microsoft/TypeScript/pull/63936) for `.astro` files. It lets `tsgo` parse and type-check Astro components directly, without a language server plugin, by transforming each component to TSX and reporting the position mappings back to TypeScript.

> [!WARNING]
> Content mappers are experimental and only exist in TypeScript nightlies (`>=7.1.0-dev.20260822.1`). The protocol has already changed once since it landed and has no version negotiation, so expect breakage between nightlies.

## Usage

Install the package, then register it in your `tsconfig.json`. `contentMappers` is a top-level key, a sibling of `compilerOptions` rather than a member of it:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "astro"
  },
  "contentMappers": [
    {
      "package": "@astrojs/ts-content-mapper",
      "extensions": [".astro"]
    }
  ]
}
```

Content mappers run arbitrary code from `node_modules` during compilation, so TypeScript requires an explicit opt-in flag:

```sh
tsgo --noEmit --runExternalCode
```

The flag is command-line only and cannot be set in `tsconfig.json`. Without it, TypeScript reports an error and ignores the mapper entirely, which makes `.astro` files look like unknown foreign files.

Imports of Astro components must include the extension, since `.astro` is not a native TypeScript extension:

```ts
import Card from './Card.astro';
```

## How it works

TypeScript spawns this package as a subprocess and speaks JSON-RPC to it over stdin/stdout, calling `initialize`, `openProject`, `transform` and `closeProject`. For each `.astro` file, `transform` runs the Rust `astro2tsx` compiler and returns:

- the generated TSX as virtual `.tsx` text,
- a span map relating ranges of that text back to the original component,
- any parse errors, positioned against the original source.

Span offsets are UTF-16 code units, matching what `astro2tsx` emits.

Regions of the generated file that came verbatim from the source are reported as `Verbatim` spans, which are the only kind TypeScript will write edits back through, so renames and code actions apply to the frontmatter and to expressions in the template. Scaffolding that has no counterpart in the source is left unmapped and treated as synthesized. The generated component export is anchored to a zero-length range at the top of the file so that "go to definition" on a component import resolves.

## Limitations

- `<style>` blocks are not type-checked; CSS support stays with the Astro language server.
- `<script>` blocks are not yet emitted as supplemental virtual files, so their contents are not type-checked.
- Diagnostics cannot be filtered by code, so every error TypeScript finds in the generated TSX reaches the user.
