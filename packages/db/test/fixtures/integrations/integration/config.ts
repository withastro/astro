import { defineDB } from 'astro:db';
import { menu } from './shared';

export default defineDB({
	tables: {
		menu,
	},
});
