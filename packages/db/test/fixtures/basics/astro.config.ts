import { defineConfig } from 'astro/config';
import db, { defineCollection, defineWritableCollection, field } from '@astrojs/db';

const Author = defineCollection({
	fields: {
		name: field.text(),
	},
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

const Themes = defineWritableCollection({
	fields: {
		name: field.text(),
	},
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
	},
});

