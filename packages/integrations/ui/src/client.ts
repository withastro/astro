import { createRuntime } from './runtime.js';

// Module scripts run after parsing, so the whole document is here.
const runtime = createRuntime(document);
runtime.start();

export const __register = runtime.register;
