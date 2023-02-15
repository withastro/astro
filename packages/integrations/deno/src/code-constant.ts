export const DEFAULTIMPORT = `import { Server } from "https://deno.land/std@0.167.0/http/server.ts"; \n import { fetch } from "https://deno.land/x/file_fetch/mod.ts";\nimport { fileExtension } from "https://deno.land/x/file_extension@v2.1.0/mod.ts";`
export const DEFAULTSTART = `const _start = 'start'; \n if(_start in adapter) { \nadapter[_start](_manifest, _args);}`
