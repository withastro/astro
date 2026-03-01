import { manifest } from 'virtual:astro:manifest';
import { BuildApp } from '../core/build/app.js';

const app = new BuildApp(manifest);

export { app, manifest };
