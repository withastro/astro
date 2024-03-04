import { defineDB } from '@astrojs/db';
import { menu } from './shared';

export default defineDB({
	tables: {
		menu,
	},
});
