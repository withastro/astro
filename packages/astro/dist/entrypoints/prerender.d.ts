import { manifest } from 'virtual:astro:manifest';
import { BuildApp } from '../core/build/app.js';
declare const app: BuildApp;
export { app, manifest };
