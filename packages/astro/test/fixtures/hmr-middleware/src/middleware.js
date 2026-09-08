import { defineMiddleware } from "astro:middleware";
import { MiscUtils } from "./utils/misc";

let executed = 0;

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.utils = new MiscUtils();

	// add newline here
  executed += 1;

	return next().then((res) => {
		res.headers.set("x-test-executed", executed);
		res.headers.set("x-test-other-count", context.locals.utils.nestedImportCount())
	});
});
