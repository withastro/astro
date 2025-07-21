import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:dynamic.css";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export default {
    name: VIRTUAL_MODULE_ID,
    resolveId(source) {
        if (!source.startsWith(VIRTUAL_MODULE_ID)) return;

        return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
        if (!id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) return;

        return "body { background: red; }";
    },
} satisfies Plugin;
