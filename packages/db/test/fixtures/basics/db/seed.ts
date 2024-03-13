import { Author, db } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';
import { Themes as ThemesConfig } from './theme';

const Themes = asDrizzleTable('Themes', ThemesConfig);
export default async function () {
	await db.batch([
		db
			.insert(Themes)
			.values([{ name: 'dracula' }, { name: 'monokai', added: new Date() }])
			.returning({ name: Themes.name }),
		db
			.insert(Author)
			.values([
				{ name: 'Ben' },
				{ name: 'Nate' },
				{ name: 'Erika' },
				{ name: 'Bjorn' },
				{ name: 'Sarah' },
			]),
	]);
}
