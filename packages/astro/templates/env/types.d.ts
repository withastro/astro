declare module 'astro:env/client' {
	// @@CLIENT@@
}

declare module 'astro:env/server' {
	// @@SERVER@@

	type SecretValues = {
		// @@SECRET_VALUES@@
	};

	type SecretValue = keyof SecretValues;

	type Loose<T> = T | (string & {});
	type Strictify<T extends string> = T extends `${infer _}` ? T : never;

	export const getSecret: <TKey extends Loose<SecretValue>>(
		key: TKey
	) => TKey extends Strictify<SecretValue> ? SecretValues[TKey] : string | undefined;
}
