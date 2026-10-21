# @astrojs/ts-content-mapper

A [TypeScript content mapper](https://github.com/microsoft/TypeScript/pull/63936) for `.astro` files. It lets TypeScript 7.1+ (`tsc`) parse and type-check Astro components directly, without needing to use a different language server or CLI Tool.

## Usage

Install the package, then register it in your `tsconfig.json` for `.astro` files:

```json
{
  "compilerOptions": {
    // ...
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
tsc --noEmit --runExternalCode
```
