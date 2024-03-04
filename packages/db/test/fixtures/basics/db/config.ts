import { Themes } from './theme';
import { column, defineDB, defineTable } from 'astro:db';

const Author = defineTable({
	columns: {
		name: column.text(),
		age2: column.number({optional: true}),
	},
});

export default defineDB({
	tables: { Author, Themes },
});
