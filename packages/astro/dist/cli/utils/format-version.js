function formatVersion({ name, textStyler, astroVersionProvider }) {
	return `  ${textStyler.bgGreen(textStyler.black(` ${name} `))} ${textStyler.green(
		`v${astroVersionProvider.version}`,
	)}`;
}
export { formatVersion };
