import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:dynamic.css";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export default {
	name: VIRTUAL_MODULE_ID,
	resolveId: {
		filter: {
			id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
		},
		handler() {
			return RESOLVED_VIRTUAL_MODULE_ID;
		},
	},
	load: {
		filter: {
			id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID}$`),
		},
		handler() {
			return "body { background: red; }";
		},
	},
} satisfies Plugin;
