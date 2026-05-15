class BuildFontFileIdGenerator {
	#hasher;
	#contentResolver;
	constructor({ hasher, contentResolver }) {
		this.#hasher = hasher;
		this.#contentResolver = contentResolver;
	}
	generate({ originalUrl, type }) {
		return `${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`;
	}
}
export { BuildFontFileIdGenerator };
