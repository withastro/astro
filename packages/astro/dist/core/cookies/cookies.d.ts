import type { SerializeOptions } from 'cookie';
export type AstroCookieSetOptions = Pick<
	SerializeOptions,
	| 'domain'
	| 'path'
	| 'expires'
	| 'maxAge'
	| 'httpOnly'
	| 'sameSite'
	| 'secure'
	| 'encode'
	| 'partitioned'
>;
export interface AstroCookieGetOptions {
	decode?: (value: string) => string;
}
export type AstroCookieDeleteOptions = Omit<AstroCookieSetOptions, 'expires' | 'maxAge' | 'encode'>;
interface AstroCookieInterface {
	value: string;
	json(): Record<string, any>;
	number(): number;
	boolean(): boolean;
}
interface AstroCookiesInterface {
	get(key: string): AstroCookieInterface | undefined;
	has(key: string): boolean;
	set(
		key: string,
		value: string | number | boolean | Record<string, any>,
		options?: AstroCookieSetOptions,
	): void;
	delete(key: string, options?: AstroCookieDeleteOptions): void;
}
declare class AstroCookie implements AstroCookieInterface {
	value: string;
	constructor(value: string);
	json(): any;
	number(): number;
	boolean(): boolean;
}
declare class AstroCookies implements AstroCookiesInterface {
	#private;
	constructor(request: Request);
	/**
	 * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
	 * in a Set-Cookie header added to the response.
	 * @param key The cookie to delete
	 * @param options Options related to this deletion, such as the path of the cookie.
	 */
	delete(key: string, options?: AstroCookieDeleteOptions): void;
	/**
	 * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
	 * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
	 * from that set call, overriding any values already part of the request.
	 * @param key The cookie to get.
	 * @returns An object containing the cookie value as well as convenience methods for converting its value.
	 */
	get(key: string, options?: AstroCookieGetOptions | undefined): AstroCookie | undefined;
	/**
	 * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
	 * part of the initial request or set via Astro.cookies.set(key)
	 * @param key The cookie to check for.
	 * @param _options This parameter is no longer used.
	 * @returns
	 */
	has(key: string, _options?: AstroCookieGetOptions): boolean;
	/**
	 * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
	 * an object it will be stringified via JSON.stringify(value). Additionally you
	 * can provide options customizing how this cookie will be set, such as setting httpOnly
	 * in order to prevent the cookie from being read in client-side JavaScript.
	 * @param key The name of the cookie to set.
	 * @param value A value, either a string or other primitive or an object.
	 * @param options Options for the cookie, such as the path and security settings.
	 */
	set(key: string, value: string | Record<string, any>, options?: AstroCookieSetOptions): void;
	/**
	 * Merges a new AstroCookies instance into the current instance. Any new cookies
	 * will be added to the current instance, overwriting any existing cookies with the same name.
	 */
	merge(cookies: AstroCookies): void;
	/**
	 * Astro.cookies.header() returns an iterator for the cookies that have previously
	 * been set by either Astro.cookies.set() or Astro.cookies.delete().
	 * This method is primarily used by adapters to set the header on outgoing responses.
	 * @returns
	 */
	headers(): Generator<string, void, unknown>;
	/**
	 * Marks the cookies as consumed and returns the header values.
	 * After consumption, any subsequent `set()` calls will warn.
	 */
	consume(): Generator<string, void, unknown>;
	/**
	 * @deprecated Use the instance method `cookies.consume()` instead.
	 * Kept for backward compatibility with adapters.
	 */
	static consume(cookies: AstroCookies): Generator<string, void, unknown>;
}
export { AstroCookies };
