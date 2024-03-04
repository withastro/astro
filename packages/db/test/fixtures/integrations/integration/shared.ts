import { defineTable, column } from '@astrojs/db';

export const menu = defineTable({
	columns: {
		name: column.text(),
		type: column.text(),
		price: column.number(),
	},
});
