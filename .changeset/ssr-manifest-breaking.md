---
'astro': major
---

**SSRManifest structure changes:** Path properties now strictly require `URL` objects, and several new required properties have been added.

**Changes:**
- Path properties changed from `string | URL` to strictly `URL`: `srcDir`, `outDir`, `cacheDir`, `publicDir`, `buildClientDir`, `buildServerDir`
- New required properties: `rootDir: URL`, `assetsDir: string`, `serverLike: boolean`, `logLevel: LoggerLevel`
- Removed `hrefRoot` property
- Server islands now accessed via async method: `serverIslandMappings?: () => Promise<ServerIslandMappings>` (instead of sync properties)
- Session driver now accessed via async method: `sessionDriver?: () => Promise<{ default: SessionDriver | null }>`
