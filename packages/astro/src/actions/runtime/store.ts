import type { APIContext } from '../../@types/astro.js';
import { AsyncLocalStorage } from "node:async_hooks";

export const ApiContextStorage = new AsyncLocalStorage<APIContext>();
