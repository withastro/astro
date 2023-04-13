type MiddlewareResponseHandler = import('./dist/@types/astro.js').MiddlewareResponseHandler;

type Sequence = (...handlers: MiddlewareResponseHandler[]) => MiddlewareResponseHandler;
