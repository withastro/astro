// Types for `scope` inside <script scoped>. Reference this from `src/env.d.ts`:
// /// <reference types="@astrojs/ui/scope" />
import type { Scope } from './types.js';

declare global {
	const scope: Scope;
}
