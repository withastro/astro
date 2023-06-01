import { getEntry } from 'astro:content';

const langs = ['en', 'es', 'fr']

export function getStaticPaths() {
	return langs.map(lang => ({ params: { lang } }))
}

/** @param {import('astro').APIContext} params */
export async function get({ params }) {
	const { lang } = params;
	const translations = await getEntry('i18n', lang);
	if (!translations) {
		return {
			body: JSON.stringify({ error: `Translation ${lang} Not found` }),
		}
	} else {
		return {
			body: JSON.stringify(translations),
		}
	}
}
