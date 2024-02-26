import db, { defineTable, column } from '@astrojs/db';
import { defineConfig } from 'astro/config';
import { asJson, createGlob } from './utils';

const Quote = defineTable({
	columns: {
		author: column.text(),
		body: column.text(),
		file: column.text({ unique: true }),
	},
});

export default defineConfig({
	db: {
		tables: { Quote },
		data({ seed, ...ctx }) {
			if (ctx.mode === 'dev') {
				const glob = createGlob(ctx);
				glob('quotes/*.json', {
					into: Quote,
					parse: asJson,
				});
			}
		},
	},
	integrations: [db()],
});
