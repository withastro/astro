import { NOW, column, defineWritableTable, sql } from '@astrojs/db';
import type { AstroIntegration } from 'astro';

const Themes = defineWritableTable({
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
						async data({ seed }) {
							// Seed writable tables in dev mode, only
							// but in this case we do it for both, due to tests
							await seed(Themes, [{ name: 'dracula' }, { name: 'monokai', added: new Date() }]);
						},
					},
				});
			},
		},
	};
}
