import { handle } from '../utils/handler.js';

export default {
	fetch: handle,
} satisfies ExportedHandler<Env>;
