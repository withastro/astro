import { createApp } from 'astro/app/entrypoint';
import { manifest as _manifest, renderers } from 'astro/app/runtime/manifest';
import { server as actions } from 'virtual:astro:actions/entrypoint';

const app = createApp();
const { pageMap } = _manifest;

// Export middleware lazy-loaded
const middleware = () => import('virtual:astro:middleware');

export { app, pageMap, _manifest as manifest, renderers, middleware, actions };
