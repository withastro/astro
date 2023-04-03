type MiddlewareHandler = import('./dist/@types/astro.js').MiddlewareHandler;

type Sequence = (...handlers: MiddlewareHandler[]) => MiddlewareHandler;
