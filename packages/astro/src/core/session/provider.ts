// Re-export shim. Importing `provideSession` from `./provider.js` (rather
// than `./handler.js` directly) lets the Vite plugin swap this file for
// `./provider-disabled.js` when `session: false` is configured, so Rollup
// can tree-shake `./runtime.js` out of the SSR bundle.
//
// At runtime in environments without Vite (Node-loaded `dist/`, library
// tooling), this file resolves normally and keeps the real provider.
export { provideSession } from './handler.js';
