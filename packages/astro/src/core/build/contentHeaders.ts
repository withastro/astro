import contentTypeLib from 'content-type';
import contentDispositionLib from 'content-disposition';

export class ContentHeaders {
	#contentType: contentTypeLib.ParsedMediaType | null;
	#contentDisposition: contentDispositionLib.ContentDisposition | null;

	constructor(headers: Headers) {
		this.#contentType = ContentHeaders.#parseContentType(headers);
		this.#contentDisposition = ContentHeaders.#parseContentDisposition(headers);
	}

	get charset(): string | undefined {
		return this.#contentType?.parameters.charset;
	}

	get mediaType(): string | undefined {
		return this.#contentType?.type;
	}

	get filename(): string | undefined {
		return this.#contentDisposition?.parameters.filename;
	}

	static #parseContentType(headers: Headers): contentTypeLib.ParsedMediaType | null {
		const header = headers.get('Content-Type');
		if (header == null) {
			return null;
		}

		try {
			return contentTypeLib.parse(header);
		} catch (err) {
			console.error(`Had trouble parsing Content-Type header = "${header}"`, err);
		}

		return null;
	}

	static #parseContentDisposition(
		headers: Headers,
	): contentDispositionLib.ContentDisposition | null {
		const header = headers.get('Content-Disposition');
		if (header == null) {
			return null;
		}

		try {
			return contentDispositionLib.parse(header);
		} catch (err) {
			console.error(`Had trouble parsing Content-Disposition header = "${header}"`, err);
		}

		return null;
	}
}
