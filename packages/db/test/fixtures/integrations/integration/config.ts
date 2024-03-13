import { menu } from './shared';
import { defineDb } from 'astro:db';

export default defineDb({
	tables: {
		menu,
	},
});
