import { NOW, column, defineTable, sql } from '@astrojs/db';
import type { AstroIntegration } from 'astro';

const Themes = defineTable({
	columns: {
		name: column.text(),
		added: column.date({
			default: sql`CURRENT_TIMESTAMP`,
		}),
		updated: column.date({
			default: NOW,
		}),
		isDark: column.boolean({ default: sql`TRUE` }),
		owner: column.text({ optional: true, default: sql`NULL` }),
	},
});

export function themes(): AstroIntegration {
	return {
		name: 'themes-integration',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					db: {
						tables: { Themes },
					},
				});
			},
		},
	};
}
