import { Themes } from './theme';
import { column, defineDB, defineTable } from 'astro:db';

const Author = defineTable({
	columns: {
		name: column.text(),
	},
});

export default defineDB({
	tables: { Author, Themes },
});
