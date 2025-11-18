import { server as actions } from 'virtual:astro:actions/entrypoint';
import { manifest as _manifest } from 'virtual:astro:manifest';
import { createApp } from 'astro/app/entrypoint';

const app = createApp();
const { renderers } = _manifest;

// Export middleware lazy-loaded
const middleware = () => import('virtual:astro:middleware');

export { app, _manifest as manifest, renderers, middleware, actions };
