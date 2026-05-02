// Drop-in ESM replacement for the `debug` package, used via Vite's
// `resolve.alias` in server environments that run under workerd
// (astro dev + @cloudflare/vite-plugin).
//
// The original `debug` package references `module.exports` at the top
// level of its CJS entrypoint, which throws `ReferenceError: module is
// not defined` when @cloudflare/vite-plugin loads it in the Workers
// runner. `obug` (https://www.npmjs.com/package/obug) is an ESM fork
// with the same behavior but exposes only named exports; this shim
// re-exposes a default export so consumers that do
// `import debug from "debug"` or `const debug = require("debug")`
// keep working after the alias is applied.
import { createDebug, disable, enable, enabled, namespaces } from 'obug';

export default createDebug;
export { createDebug, disable, enable, enabled, namespaces };
