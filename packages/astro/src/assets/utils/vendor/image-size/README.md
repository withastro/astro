# Vendored image-size

Vendored from [image-size](https://github.com/image-size/image-size) v2.0.2.

Upstream is archived and v2.0.2 is its final release, so there is nothing left to sync from. Hardening
fixes below are ported from the maintained MIT community fork
[image-size-next](https://github.com/lcf2212dev/image-size-next) v2.1.1, which keeps the same public API.

## Changes

- Files removed: `fromFile.ts`, `index.ts`
- `imageSize()` renamed to `lookup()`, dropping the `disabledTypes` option and the "pick the largest
  image by area" behaviour (`./lookup.ts`)
- Import specifiers rewritten to explicit `.js`/`.ts` extensions for `NodeNext` resolution
- `node:fs` import dropped from `./types/tiff.ts` (unused, and it broke browser bundling)
- Added `avis` brand for AVIF sequences (`./types/heif.ts`)
- Added `detectType()` to handle files with out-of-order ftyp brands (`./types/heif.ts`)
- Updates `BitReader` properties assignment to work with `erasableSyntaxOnly`
- Assorted `as T` casts replaced with non-null assertions, and `String#match` with `RegExp#exec`,
  to satisfy the repo's lint rules
- Ported box and entry size guards from image-size-next so malformed input cannot stall the parser
  (`./types/utils.ts`, `./types/icns.ts`, `./types/jxl.ts`, `./types/heif.ts`, `./types/jp2.ts`)

## Not ported from image-size-next

- Optional chaining on `typeHandlers.get()` in `./detector.ts` and `./lookup.ts`
- The JPG segment length guard in `./types/jpg.ts`; that loop already advances by at least two bytes
  per iteration, so it terminates regardless
