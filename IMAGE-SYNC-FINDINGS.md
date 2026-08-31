# Content collection images & transforms — findings

Investigation notes backing the "Decouple Astro from zod" proposal (`PLAN.md`),
specifically the claim that schema transforms and image validation were "lost
with the content layer".

All line references are against `main` at `2548abf187`.

## 1. Do transforms work in content collections today?

**Yes — the claim in PLAN.md is half wrong.** Transforms run and their output is
kept. Two real constraints make them *feel* broken.

`getEntryData` (`packages/astro/src/content/utils.ts:207-217`) calls
`safeParseAsync` — the comment says explicitly "Use `safeParseAsync` to allow
async transforms" — and assigns `data = parsed.data`. The content-layer sync
path routes through it (`content-layer.ts:319`). There is already a fixture
exercising this: `packages/astro/test/fixtures/content-layer/src/content.config.ts:88-91`
transforms a string into `{ type: 'test', content: str }`. Nothing asserts on it,
which is probably why the capability is not widely known.

Live collections parse at request time (`runtime.ts:61`), so transforms there are
unconstrained.

### Constraint A — build-time collections must return devalue-serializable output

Parsed data is persisted with `devalue.stringify` and **no custom reducers**
(`data-store-writer.ts:55,216`). A transform returning a class instance or a
function throws at sync time. POJOs, `Date`, `Map`, `Set`, `RegExp`, `BigInt` are
fine. `data-store.ts:42-45` acknowledges this boundary in a comment.

### Constraint B — `image()` does not compose with user transforms

In the content layer, `image()` is itself just a `z.string().transform(...)` that
returns a **marker string**, not metadata (`content/utils.ts:176-201`):

```
__ASTRO_IMAGE_./cover.jpg
```

Resolution to real `ImageMetadata` happens much later: `MutableDataStore.set`
walks the parsed data, records where prefixed strings sit in `imageImports`,
strips the prefix (`mutable-data-store.ts:433-440`), and read-time resolution
rewrites those recorded paths (`runtime.ts:576-599`). Consequences:

- A transform chained after `image()` receives the marker string. `img.width` is
  `undefined`.
- If that transform consumes or rewrites the string, the image silently never
  resolves.
- **No validation.** The `existsSync` check at `content/utils.ts:196` only decides
  whether to prefix `./`; a missing file falls through silently on the assumption
  it might be a Vite alias.

So: "schema transforms lost" is inaccurate; "image validation lost" is accurate,
and the two complaints share a single root cause — the marker-string design.

## 2. Can `getImage()` be called with an `@fs` path during sync?

**Yes, it runs and returns without throwing — and that is the problem.**

Verified empirically by replicating `createTempViteServer` against the
`content-layer` fixture:

```
ImageMetadata produced during sync:
  src:    /@fs/home/florian/.../content-layer/images/shuttle.jpg
          ?origWidth=1024&origHeight=779&origFormat=jpg
  width:  1024, height: 779, format: jpg
  fsPath: /home/florian/.../content-layer/images/shuttle.jpg   (non-enumerable)

getImage({ src: metadata, width: 100 }) →
  src: /_image?href=%2F%40fs%2Fhome%2Fflorian%2F...%2Fshuttle.jpg%3ForigWidth%3D1024...&w=100&h=76&f=webp
  attributes: {"loading":"lazy","decoding":"async","width":100,"height":76}

addStaticImage present? undefined
staticImages queued: 0
```

### Why it resolves at all

`syncInternal` keeps a temp Vite dev server alive for the whole content sync
(`core/sync/index.ts:144-183`), so `ssrLoadModule` reaches both the image file and
`virtual:astro:get-image`. `imageConfig` is inlined from `settings.config.image`
(`vite-plugin-assets.ts:202`), and the server counts as a server environment, so
the real `getImage` is exported rather than the throwing stub.

### Why the output is unusable

1. **`addStaticImage` is undefined.** Assigned only in the assets plugin's
   `buildStart` under `if (!isBuild) return` (`vite-plugin-assets.ts:286-289`),
   where `isBuild` comes from `env.command === 'build'` (`:152`). The temp server
   is `createServer`, so Vite's command is `'serve'` regardless of the
   `command: 'build'` Astro passes to `createVite`. Every image transformed during
   sync is silently dropped from the static generation queue.

2. **Sync runs before the real build.** `syncInternal` is called from
   `BaseBuilder.setup` (`core/build/index.ts:167-177`) *before* `build()`. So even
   with (1) fixed, sync has no Rollup context — no `fileEmitter`, so
   `emitESMImage` takes the `if (!isBuild)` branch
   (`assets/utils/node.ts:175-183`) and produces `/@fs/…` instead of the
   `__ASTRO_ASSET_IMAGE__<handle>__` placeholder that `renderChunk` later rewrites
   to the hashed output path (`vite-plugin-assets.ts:291-300`).

3. **The `/@fs` URL is dev-only and machine-local.** `/_image` resolves to
   `astro/assets/endpoint/dev` only when `command === 'dev'`
   (`assets/endpoint/config.ts:21-25`); the generic endpoint has no `/@fs`
   unwrapping — that lives solely in `endpoint/dev.ts:17-20`. And since sync output
   is persisted via `devalue.stringify` (`data-store-writer.ts:216`), this bakes an
   absolute build-machine path into a cached artifact.

### API constraint

`getImage()` rejects a bare `/@fs/…` **string** with `LocalImageUsedWrongly`
(`assets/services/service.ts:159-168`). It requires a full `ImageMetadata` object.
That is what the ESM import provides and what dev uses today, so this is a
non-issue in practice — but it rules out "just pass the path".

### Conclusion

Eager `getImage()` at sync time is viable in dev and structurally impossible in
build. The blocker is **ordering, not capability**. The marker-string design is
not incidental: deferring to read time is precisely what lets one store entry
serve a `/@fs` URL in dev and a rollup-emitted hashed path in build.

## 3. Design: probe at sync via a Node-only entrypoint, defer `src`, merge at read time

`image()` ships from **`astro/content/image`**, a Node-only entrypoint, not from
`astro:content`. That is what lets it read the file: `astro:content` is imported by pages
and must stay free of Node builtins, but a config-only entrypoint is not (see section 5).

It returns an **object**, which fixes composition — transforms downstream of `image()`
receive something they can spread and extend, and read-time resolution merges the real
`ImageMetadata` over it rather than overwriting the field.

| Field | Known at sync? | Source |
|---|---|---|
| `width`, `height`, `format`, `orientation` | yes, when locatable from `context.filePath` | probe file bytes |
| `src` | no — marker only | Vite: `/@fs` in dev, hashed emit in build |
| user-added fields | yes | the schema's own transforms; preserved by the merge |

`src` stays deferred regardless: sync runs before Rollup exists, so the final URL cannot be
known (section 2). Everything else is available to the schema, which means refinements on
dimensions work.

### Change 1 — `content/image.ts` (new), exported as `astro/content/image`

```js
import { image } from 'astro/content/image';

schema: (context) => z.object({
  cover: z.string()
    .transform((src) => image(context, { src }))
    .refine((cover) => cover.width >= 1000, 'cover must be at least 1000px wide'),
})
```

`image()` resolves the source against `context.filePath` (absolute), probes it with
`imageMetadata` (`assets/utils/metadata.ts:13`) and returns
`{ [IMAGE_FIELD_MARKER]: true, src: <marker>, width, height, format }`.

Deliberately uses the low-level prober, not `emitImageMetadata`, whose no-`fileEmitter`
branch would build the dev-only `/@fs/...` URL from section 2 that must never reach the
data store.

Resolution rules, by source shape. A sibling file is found directly; everything else goes
through Vite's plugin container, so **every shape is probed and validated**:

| Source | Resolved by | Missing file |
|---|---|---|
| `./cover.png`, `../x/cover.png` | filesystem, from `context.filePath` | throws `ImageNotFound` |
| `cover.png` (bare) | filesystem if a sibling exists, else Vite | throws `ImageNotFound` |
| `@images/cover.png` | Vite (`pluginContainer.resolveId`) | throws `ImageNotFound` |
| `/images/cover.png` | Vite, against the project root | throws `ImageNotFound` |
| `https://…` | not resolved — remote | deferred |
| any, when the loader gave no absolute path, or outside a sync | not resolved | deferred |

A bare filename found on disk is normalized to `./name`; every other source is stored
unchanged, because Vite resolves it again from the entry file at read time, so an alias has
to stay an alias.

### Change 2 — the Vite resolver, installed on `globalThis.astroAsset`

The schema context stays `{ filePath, image }` — no resolver, nothing internal. The
resolver is installed on `globalThis.astroAsset.contentImageResolver`
(`assets/types.ts:34-43`) by `ContentLayer` for the duration of a sync, and read by
`image()`.

It wraps `server.environments.ssr.pluginContainer.resolveId(source, importer)`, matching
how `astro:content-asset-propagation` resolves the same source at read time
(`vite-plugin-content-assets.ts:50-56`). The server reaches `ContentLayer` through
`ContentLayerOptions.viteServer`, from `core/sync/index.ts` (the temp server) and
`core/dev/dev.ts` (the dev container's).

`globalThis.astroAsset` is the existing Astro mechanism for exactly this: `imageService`
and `addStaticImage` are shared the same way, for the same reason — see section 5.

### Change 3 — `mutable-data-store.ts:434-441`: record the container, strip the marker

`neotraverse`'s `update(value, stopHere)` (`utils-Bfb1gHfd.d.ts:148`) rewrites an object
node without descending into it. Record `ctx.path` (the container, e.g. `['cover']` — same
shape as today), strip the marker key and the `src` prefix, and add the stripped `src` to
`foundAssets` so the generated asset-imports file still picks it up.

### Change 4 — `runtime.ts:576-599`: merge instead of replace

At read time, for an object-form image field, merge rather than overwrite:

```ts
{ ...current, ...resolved }
```

Resolved wins on `src`/`width`/`height`/`format` (authoritative); user-added keys survive.
This is what makes composition work:

```js
cover: z.string()
  .transform((src) => image(context, { src }))
  .transform((img) => ({ ...img, credit: 'NASA' })),
```

`credit` is still present after read-time resolution. Today the second transform receives
the marker *string*, and anything it builds around it breaks resolution entirely.

`setAtPathCopying` (`runtime.ts:562`) already copies only along the path, so its documented
sibling-preservation guarantee still holds.

## 4. Prototype results

Implemented and verified end-to-end. Files touched:

- `content/image.ts` (new) — `image()`; Node-only, exported as `astro/content/image`
- `package.json` — `"./content/image": "./dist/content/image.js"`
- `content/utils.ts` — schema context is `{ filePath, image }`
- `content/runtime.ts` — merge-instead-of-replace in `updateImageReferencesInData`
- `content/consts.ts` — `IMAGE_FIELD_MARKER`
- `content/mutable-data-store.ts` — object-form branch in the `forEach`
- `templates/content/module.mjs` — unchanged; `image()` is deliberately NOT here
- `content/config.ts` — `SchemaContext` gains `filePath`, deprecates `image`

Verified against a copy of the `content-layer` fixture. What a refinement sees during
parse:

```
[REFINE] {"src":"__ASTRO_IMAGE_./atlantis.JPG","width":640,"height":498,"format":"jpg"}
[REFINE] {"src":"__ASTRO_IMAGE_./shuttle.jpg","width":1024,"height":779,"format":"jpg"}
[REFINE] {"src":"__ASTRO_IMAGE_@images/launch.webp"}        ← alias, deferred
[REFINE] {"src":"__ASTRO_IMAGE_/images/lunar-module.jpg"}   ← root-absolute, deferred
```

`.refine((img) => img.width >= 1000)` discriminates correctly — `atlantis` (640px) fails,
the 1024px entries pass:

```
[InvalidContentEntryDataError] spacecraftComposed → atlantis data does not match collection schema.
  heroImage: cover must be at least 1000px wide
```

Existence validation works for explicitly relative paths:

```
[ImageNotFound] Could not find requested image `./does-not-exist.jpg`. Does it exist?
```

And composition still holds through read-time resolution — `credit` and `from`, added by a
transform after `image()`, survive alongside Vite's resolved `src`:

```
{"src":"/_astro/atlantis.VCkUOnn2.JPG","width":640,"height":498,"format":"jpg",
 "credit":"NASA","from":"…/src/content/space/atlantis.md"}
<img src="/_astro/atlantis.VCkUOnn2_Z2aWptW.JPG" alt="atlantis" width="200" height="156">
```

Tests: unit `3441 pass / 0 fail`; `test/content-*.test.ts` `75 pass / 0 fail`, including the
`verify-no-node-stuff` guard. Two assertions in
`test/units/content-layer/asset-imports.test.ts` needed updating for the intentional
contract change (`data.image` is now an object; resolution merges, so the result is equal
to but not identical with the resolved metadata).

## 5. What the prototype changed about the design

### `astro:content` may not depend on Node builtins — so `image()` lives elsewhere

The `verify-no-node-stuff` plugin (`test/test-plugins.ts`) asserts that `astro:content`
pulls in no `node:fs`/`node:path`/`node:url`, so it runs on Cloudflare and Deno. An earlier
revision exported `image()` from `astro:content`, which meant it could not read the file:
a **static** import of a Node-using module trips the guard, and a plain `await import()`
does not help either, because the bundler still follows it and emits a chunk containing
`node:fs`.

The fix is to stop putting a config-time API in the page-facing module. `astro/loaders` is
the existing precedent — `loaders/glob.ts:1-3` opens with `node:fs`, `node:path`,
`node:url` and is imported straight from `content.config.ts`, because no page imports it.
`image()` follows the same pattern as `astro/content/image`.

The cost is one line of ergonomics: `image` comes from its own specifier rather than
`astro:content`. In exchange, `image()` reads the filesystem directly, with no injected
resolver, no hidden context state and no bundler escape hatch.

### Emitting `/@fs` URLs and calling `getImage()` from `image()` does not work

Tested directly, as the natural follow-up to section 2: have `image()` join
`context.filePath` with `./foo.png` (doable without `node:path` — `slash` from
`@astrojs/internal-helpers/path` plus segment manipulation), build `/@fs<abs>`, and hand
that to `getImage()`. It fails at two independent points, before the problems in section 2
even come into play.

**1. `getImage` is not reachable from `image()` during sync.** Adding
`await import('virtual:astro:get-image')` to `content/image.ts` fails at sync with:

```
Only URLs with a scheme in: file, data, and node are supported by the default ESM loader.
Received protocol 'virtual:'
```

`content.config.ts` is evaluated through the temp Vite server, but `astro` itself is
externalized, so `astro/content/runtime` and `image.ts` are loaded by plain Node. The
existing `await import('virtual:astro:get-image')` at `runtime.ts:460` works only because
that path runs at *render* time inside a Vite-bundled page. Reaching the image service
during sync means `server.ssrLoadModule`, i.e. threading the Vite server down through
`ContentLayer`.

**2. `getImage` rejects `/@fs` URLs outright.** Probed against a real temp Vite server:

```
bare /@fs string:        LocalImageUsedWrongly :: `src` must be an imported image or a URL,
                         it cannot be a string filepath. Received `/@fs/…/shuttle.jpg`.
bare /@fs string + dims: LocalImageUsedWrongly :: (same)
```

`verifyOptions` (`assets/services/service.ts:159-168`) tests for the `/@fs/` prefix
explicitly. Supplying `width`/`height` does not help — the check is on the shape of `src`,
not on missing dimensions. `getImage` needs a real `ImageMetadata` object, and constructing
one means reading the file's bytes for width/height/format, which puts `node:fs` back in
`image.ts`.

Past both, the result would still be wrong, for the reasons in section 2: the URL is
`/_image?href=/@fs/…`, `addStaticImage` is undefined so nothing is queued for generation,
and an absolute build-machine path gets persisted through `devalue.stringify`.

The only shape that could work is: thread the Vite server into `ContentLayer`, use
`pluginContainer.resolveId` + `ssrLoadModule` on the resolved file to obtain genuine
`ImageMetadata` rather than a hand-built `/@fs` string, and move sync inside the build's
Rollup context so `fileEmitter` and `addStaticImage` exist. Substantially larger than the
`image()` rework, and it drags `node:fs` back into `astro:content` unless the resolver is
injected rather than imported.

### Validation is recovered for every source shape

An earlier revision concluded validation was unreachable, and a later one that it was only
reachable for relative paths. With the Vite plugin container threaded through, every shape
resolves and is probed:

```
./atlantis.JPG           640x498  jpg
./shuttle.jpg           1024x779  jpg
@images/launch.webp     1024x1026 webp   ← alias
@images/I'm back.jpg     640x427  jpg    ← alias with a space and an apostrophe
/images/lunar-module.jpg 640x427  jpg    ← root-absolute
```

and an unresolvable source of any shape errors:

```
@images/nope.jpg  ->  Could not find requested image `@images/nope.jpg`
/images/nope.jpg  ->  Could not find requested image `/images/nope.jpg`
nope.jpg          ->  Could not find requested image `nope.jpg`
```

Only remote sources, and entries whose loader supplied no absolute path, are still
deferred.

### `image()` and the content layer do not share module instances

The resolver cannot be a plain module-level singleton in `content/image.ts`. It silently
did not work, and instrumenting both call paths showed why:

```
[DBG] resolver installed? false for @images/launch.webp   ← via `astro/content/image`
[DBG] resolver installed? true  for @images/launch.webp   ← via the deprecated ({ image })
```

`content.config.ts` imports `astro/content/image` **through Vite**, and
`createTempViteServer` sets `ssr: { external: [] }` (`core/sync/index.ts:255-260`), so Vite
processes the module rather than externalizing it. `content-layer.ts` is loaded by Node
from `dist`. Two module instances, two copies of the variable — the deprecated
`({ image })` path saw the resolver, the new one did not.

Passing it down the schema context works but puts an internal handle in public API.
`globalThis.astroAsset` is the mechanism Astro already uses to cross this exact boundary —
`imageService` is set in `assets/internal.ts` and `addStaticImage` in the Vite plugin, both
read from module instances that may not be the ones that wrote them. The resolver joins
them, and `SchemaContext` stays clean.

The alternative is externalizing `astro` in sync's Vite server so there is only ever one
instance. That is architecturally tidier, but `ssr: { external: [] }` is deliberate and
changing it affects how every loader and content config is loaded — a much wider blast
radius than one more global.

### `image()` needs the entry path, but only to find the file

Read-time resolution does not depend on it: the entry path reaches Vite through the stored
entry, where `resolveEntryData` passes `entry.filePath` to `updateImageReferencesInData`,
`imageSrcToImportId` turns it into `?importer=…`, and `astro:content-asset-propagation`
resolves against it (`vite-plugin-content-assets.ts:50-56`).

`context.filePath` is needed at *parse* time, to locate the file to probe. Note the two are
different values: `parseData` receives the **absolute** path while `store.set` receives the
root-relative one (`loaders/glob.ts:178-183`), so anything resolving paths must use the
former — resolving the latter would resolve against `process.cwd()`, which
`astro build --root <dir>` does not chdir to. `image()` falls back to deferring when the
loader supplied no absolute path.

## 6. Open problems

- **Probe cost is per-entry, per-sync.** `parseData` runs *before* `set()`, and the digest
  short-circuit lives inside `set()` (`mutable-data-store.ts:410-415`), so the digest check
  cannot avoid the read. Every image in every entry gets a full file read plus probe on
  every sync. A `Map<fsPath, metadata>` cache collapses shared images but not 1:1 hero
  images. Not measured.

- **Every unresolved source now costs a Vite `resolveId`.** Relative and sibling paths take
  the filesystem fast path, but aliases and root-absolute sources go through the plugin
  container once per field per entry per sync, on top of the probe. Unmeasured, and it
  compounds with the item above.

- **SVG cannot merge.** `resolveImageAtPath` returns a `createSvgComponent` result for SVGs
  (`runtime.ts:544-553`), so that branch replaces wholesale and drops user-added fields for
  SVG image fields only. An inconsistency users will hit.

- **The `content-layer` fixture cannot build**, on this branch or on `main`:
  `src/content/space/numeric-slug.md` (added by cb435129d1) does not satisfy the
  `spacecraft` schema, so `astro build` exits 1 at sync. Pre-existing and unrelated, but it
  blocks whole-fixture verification — the prototype was verified against a copy with that
  entry fixed.
