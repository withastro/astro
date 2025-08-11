import { defineMiddleware, sequence } from 'astro:middleware';
import * as timers from 'node:timers/promises';
import type { MiddlewareHandler } from 'astro';

const foo: MiddlewareHandler = async (_, next) => {
	await timers.setTimeout(10); // Simulate some async operation
	return next();
};

const bar = defineMiddleware(async (_, next) => {
	await timers.setTimeout(10); // Simulate some async operation
	return next();
});

export const onRequest = sequence(foo, ['bar', bar]);
