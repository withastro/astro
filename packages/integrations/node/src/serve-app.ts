import { NodeApp } from "astro/app/node"
import type { RequestHandler } from "./types.js";

/**
 * Intended to be used in both standalone and middleware mode.
 */
export default function createListener(app: NodeApp): RequestHandler {
    return async (req, res, next, locals) => {
        const request = NodeApp.createRequest(req);
        const routeData = app.match(request);
        if (routeData) {
            const response = await app.render(request, {
                addCookieHeader: true,
                locals: locals ?? Reflect.get(req, NodeApp.Symbol.locals),
                routeData,
            });
            await NodeApp.writeResponse(response, res);
        } else if (next) {
            return next();
        } else {
            const response = await app.render(req);
            await NodeApp.writeResponse(response, res);
        }
    }
}
