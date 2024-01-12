import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';

const Author = defineCollection({
	fields: {
		name: field.text(),
	},
	source: 'readable',
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
});

const Themes = defineCollection({
	fields: {
		name: field.text(),
	},
	source: 'writable',
	data() {
		return [
			{
				name: 'One',
			},
		]
	}
});

// https://astro.build/config
export default defineConfig({
	integrations: [db()],
	db: {
		collections: { Author, Themes },
	}
});

