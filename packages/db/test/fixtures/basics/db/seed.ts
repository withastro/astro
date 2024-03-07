import { asDrizzleTable } from '@astrojs/db/utils';
import { Themes as ThemesConfig } from './theme';
import { Author, db } from 'astro:db';

export default async function () {
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
}
