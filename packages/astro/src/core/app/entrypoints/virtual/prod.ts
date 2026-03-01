import { manifest } from 'virtual:astro:manifest';
import type { CreateApp } from '../../types.js';
import { App } from '../../app.js';

export const createApp: CreateApp = ({ streaming } = {}) => {
	return new App(manifest, streaming);
};
