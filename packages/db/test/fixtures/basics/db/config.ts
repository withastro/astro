import { defineDB, defineTable, column } from 'astro:db';
import { Themes } from './theme';

const Author = defineTable({
	columns: {
		name: column.text(),
	},
});

export default defineDB({
	tables: { Author, Themes },
});
