const contexts = new Map();

export function getContext<T>(key: any): T {
    return contexts.get(key);
}

export function setContext<T>(key: any, value: T): T {
    contexts.set(key, value);
    return value;
}

export function hasContext(key: any): boolean {
    return contexts.has(key);
}