export declare function link<T extends {
    next?: T;
    prev?: T;
}>(next: T, prev: T): void;
