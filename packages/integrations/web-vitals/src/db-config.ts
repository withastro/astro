import { column, defineDb, defineTable } from 'astro:db';

export const AstrojsWebVitals_Metric = defineTable({
	columns: {
		pathname: column.text(),
		route: column.text(),
		name: column.text(),
		id: column.text({ primaryKey: true }),
		value: column.number(),
		rating: column.text(),
		timestamp: column.date(),
	},
});

export default defineDb({
	tables: {
		AstrojsWebVitals_Metric,
	},
});
