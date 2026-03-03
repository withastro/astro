import Prism from 'prismjs';
import prismLoadLanguages from 'prismjs/components/index.js';

export async function loadPrism() {
	return Prism;
}
export async function loadLanguages(languages: string | string[]) {
	return prismLoadLanguages(languages);
}
