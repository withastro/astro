import { db, Author } from 'astro:db';
import { Themes as ThemesConfig } from './theme';
import { asDrizzleTable } from '@astrojs/db/utils';

const Themes = asDrizzleTable('Themes', ThemesConfig);

await db
	.insert(Themes)
	.values([{ name: 'dracula' }, { name: 'monokai', added: new Date() }])
	.returning({ name: Themes.name });
await db
	.insert(Author)
	.values([
		{ name: 'Ben' },
		{ name: 'Nate' },
		{ name: 'Erika' },
		{ name: 'Bjorn' },
		{ name: 'Sarah' },
	]);
