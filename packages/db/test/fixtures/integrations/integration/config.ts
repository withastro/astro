import { menu } from './shared';
import { defineDB } from 'astro:db';

export default defineDB({
	tables: {
		menu,
	},
});
