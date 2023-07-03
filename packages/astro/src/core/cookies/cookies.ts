import type { CookieSerializeOptions } from 'cookie';
import { parse, serialize } from 'cookie';
import { AstroError, AstroErrorData } from '../errors/index.js';

interface AstroCookieSetOptions {
	domain?: string;
	expires?: Date;
	httpOnly?: boolean;
	maxAge?: number;
	path?: string;
	sameSite?: boolean | 'lax' | 'none' | 'strict';
	secure?: boolean;
}

type AstroCookieDeleteOptions = Pick<AstroCookieSetOptions, 'domain' | 'path'>;

interface AstroCookieInterface {
	value: string | undefined;
	json(): Record<string, any>;
	number(): number;
	boolean(): boolean;
}

interface AstroCookiesInterface {
	get(key: string): AstroCookieInterface;
	has(key: string): boolean;
	set(
		key: string,
		value: string | number | boolean | Record<string, any>,
		options?: AstroCookieSetOptions
	): void;
	delete(key: string, options?: AstroCookieDeleteOptions): void;
}

const DELETED_EXPIRATION = new Date(0);
const DELETED_VALUE = 'deleted';
const responseSentSymbol = Symbol.for('astro.responseSent');

class AstroCookie implements AstroCookieInterface {
	constructor(public value: string | undefined) {}
	json() {
		if (this.value === undefined) {
			throw new Error(`Cannot convert undefined to an object.`);
		}
		return JSON.parse(this.value);
	}
	number() {
		return Number(this.value);
	}
	boolean() {
		if (this.value === 'false') return false;
		if (this.value === '0') return false;
		return Boolean(this.value);
	}
}

class AstroCookies implements AstroCookiesInterface {
	#request: Request;
	#requestValues: Record<string, string> | null;
	#outgoing: Map<string, [string, string, boolean]> | null;
	constructor(request: Request) {
		this.#request = request;
		this.#requestValues = null;
		this.#outgoing = null;
	}

	/**
	 * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
	 * in a Set-Cookie header added to the response.
	 * @param key The cookie to delete
	 * @param options Options related to this deletion, such as the path of the cookie.
	 */
	delete(key: string, options?: AstroCookieDeleteOptions): void {
		const serializeOptions: CookieSerializeOptions = {
			expires: DELETED_EXPIRATION,
		};

		if (options?.domain) {
			serializeOptions.domain = options.domain;
		}
		if (options?.path) {
			serializeOptions.path = options.path;
		}

		// Set-Cookie: token=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT
		this.#ensureOutgoingMap().set(key, [
			DELETED_VALUE,
			serialize(key, DELETED_VALUE, serializeOptions),
			false,
		]);
	}

	/**
	 * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
	 * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
	 * from that set call, overriding any values already part of the request.
	 * @param key The cookie to get.
	 * @returns An object containing the cookie value as well as convenience methods for converting its value.
	 */
	get(key: string): AstroCookie {
		// Check for outgoing Set-Cookie values first
		if (this.#outgoing?.has(key)) {
			let [serializedValue, , isSetValue] = this.#outgoing.get(key)!;
			if (isSetValue) {
				return new AstroCookie(serializedValue);
			} else {
				return new AstroCookie(undefined);
			}
		}

		const values = this.#ensureParsed();
		const value = values[key];
		return new AstroCookie(value);
	}

	/**
	 * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
	 * part of the initial request or set via Astro.cookies.set(key)
	 * @param key The cookie to check for.
	 * @returns
	 */
	has(key: string): boolean {
		if (this.#outgoing?.has(key)) {
			let [, , isSetValue] = this.#outgoing.get(key)!;
			return isSetValue;
		}
		const values = this.#ensureParsed();
		return !!values[key];
	}

	/**
	 * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
	 * an object it will be stringified via JSON.stringify(value). Additionally you
	 * can provide options customizing how this cookie will be set, such as setting httpOnly
	 * in order to prevent the cookie from being read in client-side JavaScript.
	 * @param key The name of the cookie to set.
	 * @param value A value, either a string or other primitive or an object.
	 * @param options Options for the cookie, such as the path and security settings.
	 */
	set(key: string, value: string | Record<string, any>, options?: AstroCookieSetOptions): void {
		let serializedValue: string;
		if (typeof value === 'string') {
			serializedValue = value;
		} else {
			// Support stringifying JSON objects for convenience. First check that this is
			// a plain object and if it is, stringify. If not, allow support for toString() overrides.
			let toStringValue = value.toString();
			if (toStringValue === Object.prototype.toString.call(value)) {
				serializedValue = JSON.stringify(value);
			} else {
				serializedValue = toStringValue;
			}
		}

		const serializeOptions: CookieSerializeOptions = {};
		if (options) {
			Object.assign(serializeOptions, options);
		}

		this.#ensureOutgoingMap().set(key, [
			serializedValue,
			serialize(key, serializedValue, serializeOptions),
			true,
		]);

		if ((this.#request as any)[responseSentSymbol]) {
			throw new AstroError({
				...AstroErrorData.ResponseSentError,
			});
		}
	}

	/**
	 * Astro.cookies.header() returns an iterator for the cookies that have previously
	 * been set by either Astro.cookies.set() or Astro.cookies.delete().
	 * This method is primarily used by adapters to set the header on outgoing responses.
	 * @returns
	 */
	*headers(): Generator<string, void, unknown> {
		if (this.#outgoing == null) return;
		for (const [, value] of this.#outgoing) {
			yield value[1];
		}
	}

	#ensureParsed(): Record<string, string> {
		if (!this.#requestValues) {
			this.#parse();
		}
		if (!this.#requestValues) {
			this.#requestValues = {};
		}
		return this.#requestValues;
	}

	#ensureOutgoingMap(): Map<string, [string, string, boolean]> {
		if (!this.#outgoing) {
			this.#outgoing = new Map();
		}
		return this.#outgoing;
	}

	#parse() {
		const raw = this.#request.headers.get('cookie');
		if (!raw) {
			return;
		}

		this.#requestValues = parse(raw);
	}
}

export { AstroCookies };
