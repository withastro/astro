export const DEFAULTIMPORT = `import { Server } from "https://deno.land/std@0.167.0/http/server.ts"; \n import { fetch } from "https://deno.land/x/file_fetch/mod.ts";`
export const DEFAULTSTART = `const _start = 'start'; \n if(_start in _adapter) { \n_adapter[_start](_manifest, _args);}`
