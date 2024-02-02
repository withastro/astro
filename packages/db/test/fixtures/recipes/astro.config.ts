import { defineConfig } from 'astro/config';
import astroDb, { defineCollection, field } from '@astrojs/db';

const Recipe = defineCollection({
	fields: {
		id: field.number({ primaryKey: true }),
		title: field.text(),
		description: field.text(),
	},
});

const Ingredient = defineCollection({
	fields: {
		id: field.number({ primaryKey: true }),
		name: field.text(),
		quantity: field.number(),
		recipeId: field.number(),
	},
	indexes: {
		recipeIdx: { on: 'recipeId' },
	},
	foreignKeys: [{ fields: 'recipeId', references: () => [Recipe.fields.id] }],
});

export default defineConfig({
	integrations: [astroDb()],
	db: {
		collections: { Recipe, Ingredient },
	},
});
