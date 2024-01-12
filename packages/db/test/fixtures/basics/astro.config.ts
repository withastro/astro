import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';

const Author = defineCollection({
	fields: {
		name: field.text(),
	},
	source: 'local',
	data() {
		return [
			{
				name: 'Ben',
			},
			{
				name: 'Nate',
			},
			{
				name: 'Erika',
			},
			{
				name: 'Bjorn',
			},
			{
				name: 'Sarah',
			},
		]
	}
})

// https://astro.build/config
export default defineConfig({
	integrations: [db()],
	db: {
		collections: { Author },
	}
});

