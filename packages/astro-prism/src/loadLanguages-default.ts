import prismLoadLanguages from 'prismjs/components/index.js';

export default async function loadLanguages(languages: string | string[]) {
	return prismLoadLanguages(languages);
}
