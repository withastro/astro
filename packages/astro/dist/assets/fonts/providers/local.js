import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
class LocalFontProvider {
	name = 'local';
	config;
	#fontFileReader;
	#root;
	constructor({ fontFileReader }) {
		this.config = void 0;
		this.#fontFileReader = fontFileReader;
		this.#root = void 0;
	}
	init(context) {
		this.#root = context.root;
	}
	#resolveEntrypoint(root, entrypoint) {
		const require2 = createRequire(root);
		try {
			return pathToFileURL(require2.resolve(entrypoint));
		} catch {
			return new URL(entrypoint, root);
		}
	}
	#normalizeSource(value) {
		const isValue = typeof value === 'string' || value instanceof URL;
		const url = (isValue ? value : value.url).toString();
		const tech = isValue ? void 0 : value.tech;
		return {
			url: fileURLToPath(this.#resolveEntrypoint(this.#root ?? new URL(import.meta.url), url)),
			tech,
		};
	}
	resolveFont(options) {
		return {
			fonts:
				options.options?.variants.map((variant) => {
					const shouldInfer = variant.weight === void 0 || variant.style === void 0;
					const data = {
						// If it should be inferred, we don't want to set the value
						weight: variant.weight,
						style: variant.style,
						src: [],
						unicodeRange: variant.unicodeRange,
						display: variant.display,
						stretch: variant.stretch,
						featureSettings: variant.featureSettings,
						variationSettings: variant.variationSettings,
					};
					data.src = variant.src.map((rawSource, index) => {
						const source = this.#normalizeSource(rawSource);
						if (shouldInfer && index === 0) {
							const result = this.#fontFileReader.extract({
								family: options.familyName,
								url: source.url,
							});
							if (variant.weight === void 0) data.weight = result.weight;
							if (variant.style === void 0) data.style = result.style;
						}
						return source;
					});
					return data;
				}) ?? [],
		};
	}
}
export { LocalFontProvider };
