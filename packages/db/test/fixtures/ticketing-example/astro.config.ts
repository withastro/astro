import db, { defineTable, column } from '@astrojs/db';
import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import simpleStackForm from 'simple-stack-form';

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
			default: false,
		}),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [simpleStackForm(), db(), react()],
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	db: {
		tables: {
			Event,
			Ticket,
		},
	},
});
