export interface SomeType {
    hi: string
}

export function getDefaultSomeType(): SomeType {
    return {
        hi: 'foo'
    };
}
