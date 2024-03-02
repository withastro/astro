import { defineDB, defineTable, column } from 'astro:db';

const Event = defineTable({
	columns: {
		id: column.number({
			primaryKey: true,
		}),
		name: column.text(),
		description: column.text(),
		ticketPrice: column.number(),
		date: column.date(),
		location: column.text(),
	},
});

const Ticket = defineTable({
	columns: {
		eventId: column.number({ references: () => Event.columns.id }),
		email: column.text(),
		quantity: column.number(),
		newsletter: column.boolean({
			default: true,
		}),
	},
});

export default defineDB({ tables: { Event, Ticket } });
