import { server as actions } from 'virtual:astro:actions/entrypoint';
import { manifest as _manifest } from 'virtual:astro:manifest';
import { BuildApp } from '../core/build/app.js';

const app = new BuildApp(_manifest);
const { renderers } = _manifest;

// Export middleware lazy-loaded
const middleware = () => import('virtual:astro:middleware');

export { app, _manifest as manifest, renderers, middleware, actions };
