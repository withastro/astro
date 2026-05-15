import prismLoadLanguages from 'prismjs/components/index.js';
async function loadLanguages(languages) {
	return prismLoadLanguages(languages);
}
export { loadLanguages };
