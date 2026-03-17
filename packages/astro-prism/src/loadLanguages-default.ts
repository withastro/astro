import prismLoadLanguages from 'prismjs/components/index.js';

export async function loadLanguages(languages: string | string[]) {
	return prismLoadLanguages(languages);
}
