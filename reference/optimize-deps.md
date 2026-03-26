# Vite Dep Optimizer — Astro Reference

## Why this matters

`astro build` uses Rollup and handles CJS→ESM transformation reliably. `astro dev` uses Vite 7's dev server, which serves modules individually and relies on esbuild's **dep optimizer** to pre-bundle certain dependencies as ESM before they reach the runtime. When a dep bypasses the optimizer — especially with ESM-only runtimes like Cloudflare Workers (workerd) — you get errors like `require is not defined` at runtime in dev, even though the build works fine.

This is a category of subtle bugs. There is rarely one definitive fix — the right approach depends on _why_ the dep was missed by the optimizer.

---

## How optimizeDeps works

### The two phases

**Phase 1 — Scan:** esbuild crawls `optimizeDeps.entries` to discover which deps need pre-bundling. When it finds a bare import like `import foo from 'some-pkg'` and `some-pkg` resolves to `node_modules`, it adds it to `depImports`. It does **not** recurse into `node_modules` packages — it records the top-level dep and marks it external.

**Phase 2 — Bundle:** esbuild bundles each discovered dep as its own entry point, transforming CJS→ESM. Transitive deps inside that bundle are either inlined (if they're JS/TS) or externalized (if they're non-JS or in a separate `node_modules` package that esbuild doesn't follow into).

The key insight: **the scan is intentionally shallow**. A dep's transitive deps are only pre-bundled if they are themselves discovered in the scan, or if they are directly inlined when bundling the parent dep.

### What `optimizeDeps.include` does

Entries listed in `optimizeDeps.include` are added directly to `depImports` without needing to be discovered via scanning. This is the blunt-force fix: explicitly tell the optimizer "pre-bundle this dep". The `>` notation (e.g. `@astrojs/prism > prismjs/components/index.js`) resolves transitive deps that aren't directly importable from the project root.

### What `optimizeDeps.entries` does

Glob patterns or file paths that tell esbuild _where to start scanning_. By default Vite uses `**/*.html`. In Astro, `vite-plugin-environment` sets these to include source `.astro`, `.jsx`, `.tsx`, etc. files. Entries are crucial — if the scanner never reaches a file that imports a problematic dep, the dep will never be discovered.

### `noDiscovery`

When an adapter (e.g. `@cloudflare/vite-plugin`) sets `optimizeDeps.noDiscovery: false` for an environment, the full scan runs. When `noDiscovery: true`, only `optimizeDeps.include` is used — no scanning. In Vite, `noDiscovery` defaults to `undefined` (falsy), which means scanning runs. The Cloudflare adapter explicitly sets `noDiscovery: false`.

### `isOptimizable`

Only files matching `/\.[cm]?[jt]s$/` are considered optimizable. **`.astro`, `.vue`, `.svelte`, and other non-JS files are NOT optimizable.** This means:

- Non-JS files in `node_modules` are **externalized** during optimization bundling — esbuild does not follow into them.
- A CJS dep that is only reachable through a `.astro` file in `node_modules` will not be discovered unless that `.astro` file is itself in `optimizeDeps.entries`.

This is a common source of bugs: a package ships `.astro` components that import CJS deps. The `.astro` component is in `node_modules`, so it's not in the project's source entries, and it's not optimizable, so the optimizer never sees its imports.

### The `platform` and `createRequire` banner

When esbuild bundles deps for a `node` platform environment, Vite injects:

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
```

at the top of each optimized dep. This allows CJS `require()` calls to work at runtime in Node.js.

For `browser` / `webworker` platform environments (like Cloudflare Workers), this banner is **not injected**. Any `require()` call that survives into the optimized output will fail at runtime in workerd. This means CJS deps that aren't fully inlined and transformed will break.

---

## How Astro sets up optimizeDeps

### `vite-plugin-environment` (`packages/astro/src/vite-plugin-environment/index.ts`)

This plugin implements the `configEnvironment` Vite hook. For each Vite environment (`ssr`, `astro`, `prerender`, `client`), it returns `EnvironmentOptions` including `optimizeDeps`.

Key things it does:

- Sets `optimizeDeps.entries` to include source files: `src/**/*.{jsx,tsx,vue,svelte,html,astro}` and `**/node_modules/**/*.astro`
- The `**/node_modules/**/*.astro` entry is important: it causes esbuild to scan `.astro` files inside installed packages, which allows their CJS deps to be discovered and pre-bundled.
- Only sets entries when `_options.optimizeDeps?.noDiscovery === false` — i.e. only for environments where the full scan is enabled.
- Sets `ONLY_DEV_EXTERNAL` — a hardcoded list of CJS deps that should be externalized in dev (kept as a fallback/legacy workaround list).

### `vitefu` and `crawlFrameworkPkgs` (`packages/astro/src/core/create-vite.ts`)

`crawlFrameworkPkgs` from the `vitefu` package walks the project's `node_modules` dep tree and identifies "framework packages" — packages that peer/depend on `astro`, have `astro` in their keywords, or match `astro-*` naming conventions.

Framework packages are placed in `resolve.noExternal` (they get bundled through Vite rather than externalized) and historically in `optimizeDeps.exclude` (though this may cause issues — see Debugging section).

The result (`astroPkgsConfig`) is passed to `vitePluginEnvironment`.

### The Cloudflare adapter's `configEnvironment`

`@astrojs/cloudflare` also implements `configEnvironment`. For the `ssr` environment, it sets an explicit `optimizeDeps.include` list (things that need to be pre-bundled unconditionally). It also registers `astroFrontmatterScanPlugin` as an esbuild plugin in `optimizeDeps.esbuildOptions.plugins`.

`astroFrontmatterScanPlugin` (`packages/integrations/cloudflare/src/esbuild-plugin-astro-frontmatter.ts`) handles `.astro` files during the dep scan: it reads the frontmatter (`---` block) and returns it as TypeScript for esbuild to process. This allows esbuild to see imports declared in `.astro` frontmatter and discover their deps.

---

## How non-JS files are handled in the scan

Vite's `esbuildScanPlugin` (inside `vite/dist/node/chunks/config.js`) routes files through different handlers based on type:

- Files matching `htmlTypesRE` (`.html`, `.vue`, `.svelte`, `.astro`, `.imba`) → `html` namespace
- JS/TS files → loaded directly and scanned for imports

For files in the `html` namespace, `htmlTypeOnLoadCallback` reads the file, looks for `<script>` tags, and re-emits their contents as virtual modules that esbuild can scan. **But `.astro` frontmatter is not a `<script>` tag** — it's between `---` markers. So Vite's built-in handler produces empty output for `.astro` files unless a custom esbuild plugin (like `astroFrontmatterScanPlugin`) intercepts them.

**Important subtlety:** `shouldExternalizeDep` in Vite returns `true` when `resolved === rawId` (i.e. the file was passed as an absolute path entry). This means absolute-path entries that match `htmlTypesRE` may be treated as external rather than loaded via the `html` namespace — preventing their imports from being scanned. The fix is to check if the file is in the `entries` list before externalizing it. This may be a Vite bug worth reporting upstream.

---

## Debugging playbook

### Step 1: Confirm it's an optimizer issue

Check if the failing dep is in `.vite/deps_ssr/` (or `.vite/deps/` for client). If it's not there, the optimizer didn't pre-bundle it. If it is there, check its contents — does it contain `require()` calls?

Enable Vite's built-in dep debug logging:

```bash
DEBUG="vite:deps" astro dev
```

This shows: which entries were scanned, what deps were discovered, which deps were optimized, and timing.

### Step 2: Check if entries are set

Look for `[vite:deps] Crawling dependencies using entries:` in the debug output. If entries are empty or missing your source files, `vite-plugin-environment` may not be setting them (check the `noDiscovery` condition).

Add temporary logging to `vite-plugin-environment/index.ts`:

```ts
console.log(
  `[vite-plugin-environment] ${environmentName} entries:`,
  finalEnvironmentOptions.optimizeDeps?.entries,
);
```

### Step 3: Check if the dep is being discovered

Add logging to Vite's `esbuildScanPlugin` `onResolve` handler (in `node_modules/.pnpm/vite@.../chunks/config.js`):

```js
// Inside onResolve({ filter: /^[\w@][^:]/ })
if (moduleListContains(exclude, id)) {
  console.log(`[dep-scan] EXCLUDED: ${id}`);
}
if (isOptimizable(resolved, optimizeDepsOptions)) {
  console.log(`[dep-scan] FOUND dep: ${id} -> ${resolved}`);
} else {
  console.log(`[dep-scan] NOT optimizable: ${id} -> ${resolved}`);
}
```

### Step 4: Check if `.astro` entries are being scanned

Add logging to `astroFrontmatterScanPlugin`:

```js
build.onLoad({ filter: /\.astro$/ }, async (args) => {
  console.log('[astro-frontmatter-scan] scanning:', args.path, 'namespace:', args.namespace);
  // ...
});
```

If the plugin fires but the dep still isn't discovered, the problem is downstream (e.g. `resolveDir` missing, or the dep itself is being excluded).

### Step 5: Check vitefu exclusions

Log what vitefu is doing:

```js
// In vitefu/src/index.js onResolve handler
console.log(`[vitefu] dep=${dep} isFrameworkPkg=${isFrameworkPkg}`);
```

If a package is being put in `optimizeDeps.exclude` by vitefu, its imports won't be scanned.

### Step 6: Check `computeEntries`

Add logging to `computeEntries` in Vite's config chunk to see what entries actually get passed to esbuild:

```js
async function computeEntries(environment) {
  // ...
  console.log(
    `[computeEntries] env=${environment.name} explicitEntryPatterns=${JSON.stringify(explicitEntryPatterns)}`,
  );
  // after filter:
  console.log(`[computeEntries] env=${environment.name} after filter:`, entries);
  return entries;
}
```

---

## Potential fixes (not exhaustive)

These are approaches that may help depending on the root cause. Always investigate first rather than reaching for a fix blindly.

### Add to `optimizeDeps.entries`

If the problematic dep is only reachable through a `.astro` file in `node_modules`, adding the package's `.astro` files to entries may help:

```ts
// In vite-plugin-environment, when noDiscovery === false:
entries: [
  `${srcDirPattern}**/*.{jsx,tsx,vue,svelte,html,astro}`,
  '**/node_modules/**/*.astro', // scans .astro files in installed packages
];
```

This causes the full scan to crawl `.astro` files in `node_modules`, allowing their CJS deps to be discovered.

### Add to `optimizeDeps.include`

If the dep is known and specific, add it directly. In the Cloudflare adapter's `configEnvironment`, or in user config:

```ts
optimizeDeps: {
  include: ['some-pkg > problematic-cjs-dep'];
}
```

The `>` notation resolves transitive deps. This is a targeted fix but doesn't generalize.

### Add `resolveDir` to custom esbuild `onLoad` handlers

If you write a custom esbuild plugin that loads a file and returns contents, always include `resolveDir`:

```js
return {
  contents,
  loader: 'ts',
  resolveDir: dirname(args.path), // required for imports to resolve correctly
};
```

Without `resolveDir`, esbuild won't know where to resolve imports from the returned contents, and the imports will silently fail to be discovered.

### Check `ONLY_DEV_EXTERNAL`

`vite-plugin-environment` has a hardcoded `ONLY_DEV_EXTERNAL` list. Deps on this list are explicitly externalized in dev (`resolve.external`). If a dep is on this list, it will never be optimized — and if it's CJS, it will fail in ESM-only runtimes. Consider whether the dep can instead be handled through proper optimizer discovery rather than being hardcoded here.

---

## Key files

| File                                                                       | Role                                                                                                                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `packages/astro/src/vite-plugin-environment/index.ts`                      | Sets `optimizeDeps.entries`, `include`, `exclude`, `noExternal`, `external` per environment                          |
| `packages/astro/src/core/create-vite.ts`                                   | Calls `crawlFrameworkPkgs`, wires up all Vite plugins                                                                |
| `packages/integrations/cloudflare/src/index.ts`                            | Cloudflare adapter `configEnvironment` — sets explicit `include` list, registers `astroFrontmatterScanPlugin`        |
| `packages/integrations/cloudflare/src/esbuild-plugin-astro-frontmatter.ts` | esbuild plugin that extracts frontmatter from `.astro` files during dep scan                                         |
| `vite/dist/node/chunks/config.js` (in node_modules)                        | Contains `esbuildScanPlugin`, `computeEntries`, `globEntries`, `runOptimizeDeps` — the core optimizer implementation |
