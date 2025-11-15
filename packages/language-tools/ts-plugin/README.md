# @astrojs/ts-plugin

> Using the Astro VS Code extension? This plugin is automatically installed and configured for you.

TypeScript plugin adding support for `.astro` imports in `.ts` files. This plugin also adds support for renaming symbols and finding references across `.ts` and `.astro` files.

## Installation

```bash
npm install --save-dev @astrojs/ts-plugin
```

## Usage

Add the plugin to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@astrojs/ts-plugin"
      }
    ]
  }
}
```
