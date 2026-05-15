function randomFromArray(list) {
	return list[Math.floor(Math.random() * list.length)];
}
const categoryIcons = new Map(
	Object.entries({
		frameworks: ['puzzle', 'grid'],
		adapters: ['puzzle', 'grid', 'compress'],
		'css+ui': ['compress', 'grid', 'image', 'resizeImage', 'puzzle'],
		'performance+seo': ['approveUser', 'checkCircle', 'compress', 'robot', 'searchFile', 'sitemap'],
		analytics: ['checkCircle', 'compress', 'searchFile'],
		accessibility: ['approveUser', 'checkCircle'],
		other: ['checkCircle', 'grid', 'puzzle', 'sitemap'],
	}),
);
function iconForIntegration(integration) {
	const icons = integration.categories
		.filter((category) => categoryIcons.has(category))
		.flatMap((category) => categoryIcons.get(category));
	return randomFromArray(icons);
}
const iconColors = [
	'#BC52EE',
	'#6D6AF0',
	'#52EEBD',
	'#52B7EE',
	'#52EE55',
	'#B7EE52',
	'#EEBD52',
	'#EE5552',
	'#EE52B7',
	'#858B98',
];
function colorForIntegration() {
	return randomFromArray(iconColors);
}
export { colorForIntegration, iconForIntegration };
