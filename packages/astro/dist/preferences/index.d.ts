import { type Preferences, type PublicPreferences } from './defaults.js';
type DotKeys<T> = T extends object
	? {
			[K in keyof T]: `${Exclude<K, symbol>}${DotKeys<T[K]> extends never ? '' : `.${DotKeys<T[K]>}`}`;
		}[keyof T]
	: never;
type GetDotKey<
	T extends Record<string | number, any>,
	K extends string,
> = K extends `${infer U}.${infer Rest}` ? GetDotKey<T[U], Rest> : T[K];
type PreferenceLocation = 'global' | 'project';
interface PreferenceOptions {
	location?: PreferenceLocation;
	/**
	 * If `true`, the server will be reloaded after setting the preference.
	 * If `false`, the server will not be reloaded after setting the preference.
	 *
	 * Defaults to `true`.
	 */
	reloadServer?: boolean;
}
type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;
export type PreferenceKey = DotKeys<Preferences>;
interface PreferenceList extends Record<PreferenceLocation, DeepPartial<PublicPreferences>> {
	fromAstroConfig: DeepPartial<Preferences>;
	defaults: PublicPreferences;
}
export interface AstroPreferences {
	get<Key extends PreferenceKey>(
		key: Key,
		opts?: PreferenceOptions,
	): Promise<GetDotKey<Preferences, Key>>;
	set<Key extends PreferenceKey>(
		key: Key,
		value: GetDotKey<Preferences, Key>,
		opts?: PreferenceOptions,
	): Promise<void>;
	getAll(): Promise<PublicPreferences>;
	list(opts?: PreferenceOptions): Promise<PreferenceList>;
	ignoreNextPreferenceReload: boolean;
}
export declare function isValidKey(key: string): key is PreferenceKey;
export declare function coerce(key: string, value: unknown): any;
export default function createPreferences(
	config: Record<string, any>,
	dotAstroDir: URL,
): AstroPreferences;
export {};
