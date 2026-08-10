import { manifest } from 'virtual:astro:manifest';
import { createBuildEnvironment } from '../core/build/environment.js';
import { BuildApp } from '../core/build/app.js';
import { setEnvironment } from '../core/environment/index.js';

// Composition: the build environment record and its
// mutable `internals`/`options` closure slots live at module scope INSIDE the
// prerender bundle. `createDefaultPrerenderer.setup()` (plain Node, outside
// the bundle) imports this bundle and calls `app.setInternals(...)` /
// `app.setOptions(...)`; the facade forwards across the bundle boundary into
// the bundled closure slots. Accessors throw the same errors before injection.
const buildEnv = createBuildEnvironment();
setEnvironment(manifest, buildEnv.env);
const app = new BuildApp(manifest, buildEnv);

export { app, manifest };
