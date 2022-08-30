import { createContext } from 'preact';

const noop = () => {};
export const Context = createContext({ count: 0, increment: noop, decrement: noop });
