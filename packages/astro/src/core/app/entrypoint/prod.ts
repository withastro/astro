import { manifest } from 'virtual:astro:manifest';
import { App } from '../app.js';
import type { CreateApp } from '../types.js';

export const createApp: CreateApp = ({ streaming } = {}) => {
	return new App(manifest, streaming);
};
