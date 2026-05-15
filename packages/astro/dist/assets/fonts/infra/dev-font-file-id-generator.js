class DevFontFileIdGenerator {
	#hasher;
	#contentResolver;
	constructor({ hasher, contentResolver }) {
		this.#hasher = hasher;
		this.#contentResolver = contentResolver;
	}
	#formatWeight(weight) {
		if (Array.isArray(weight)) {
			return weight.join('-');
		}
		if (typeof weight === 'number') {
			return weight.toString();
		}
		return weight?.replace(/\s+/g, '-');
	}
	#formatStyle(style) {
		return style?.replace(/\s+/g, '-');
	}
	generate({ cssVariable, originalUrl, type, font }) {
		return [
			cssVariable.slice(2),
			this.#formatWeight(font.weight),
			this.#formatStyle(font.style),
			font.meta?.subset,
			`${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`,
		]
			.filter(Boolean)
			.join('-');
	}
}
export { DevFontFileIdGenerator };
