/// <reference types="vite/client" />

import type { ExportedHandler } from '@cloudflare/workers-types';
import { type Env, handle } from '../utils/handler.js';

export default {
 fetch: handle,
} satisfies ExportedHandler<Env>;
