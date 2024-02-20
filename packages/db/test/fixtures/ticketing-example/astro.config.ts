import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import simpleStackForm from 'simple-stack-form';
import db, { defineCollection, defineWritableCollection, column } from '@astrojs/db';
import node from '@astrojs/node';

const Event = defineCollection({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
		description: column.text(),
		ticketPrice: column.number(),
		date: column.date(),
		location: column.text(),
	},
});
const Ticket = defineWritableCollection({
	columns: {
		eventId: column.text(),
		email: column.text(),
		quantity: column.number(),
		newsletter: column.boolean({
			default: false,
		}),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [preact(), simpleStackForm(), db()],
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	db: {
		studio: true,
		collections: {
			Event,
			Ticket,
		},
		data({ seed }) {
			seed(Event, [
				{
					name: 'Sampha LIVE in Brooklyn',
					description:
						'Sampha is on tour with his new, flawless album Lahai. Come see the live performance outdoors in Prospect Park. Yes, there will be a grand piano 🎹',
					date: new Date('2024-01-01'),
					ticketPrice: 10000,
					location: 'Brooklyn, NY',
				},
			]);
		},
	},
});
