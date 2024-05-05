type SecretValues = '@@SECRET_VALUES@@';

    type SecretValue = keyof SecretValues;

    type Loose<T> = T | (string & {});
    type Strictify<T extends string> = T extends `${infer _}` ? T : never;

    // TODO: check why optional types don't return undefined with base tsconfig extend
    export const getSecret: <TKey extends Loose<SecretValue>>(key: TKey) =>
        TKey extends Strictify<SecretValue>
            ? SecretValues[TKey]
            : (string | undefined);