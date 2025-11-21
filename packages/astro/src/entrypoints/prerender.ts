import { server as actions } from 'virtual:astro:actions/entrypoint';
import { manifest } from 'virtual:astro:manifest';
import { BuildApp } from '../core/build/app.js';

const app = new BuildApp(manifest);
const { renderers } = manifest;

// Export middleware lazy-loaded
const middleware = () => import('virtual:astro:middleware');

export { app, manifest, renderers, middleware, actions };
