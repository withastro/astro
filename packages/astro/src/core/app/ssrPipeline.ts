import {TextEncoder} from "util";
import type {Environment} from "../render";
import type {EndpointCallResult} from "../endpoint";
import mime from "mime";
import {attachCookiesToResponse} from "../cookies";
import {Pipeline} from "../pipeline";

export class SSRRoutePipeline extends Pipeline {
    encoder = new TextEncoder();

    constructor(env: Environment) {
        super(env);
        this.setEndpointHandler(this.ssrEndpointHandler);
    }

    async ssrEndpointHandler(request: Request, response: EndpointCallResult): Promise<Response> {
        if (response.type === 'response') {
            if (response.response.headers.get('X-Astro-Response') === 'Not-Found') {
                // TODO: throw proper astro error to catch in the app/index.ts, and render a 404 instead
                throw new Error('');
            }
            return response.response;
        } else {
            const url = new URL(request.url);
            const headers = new Headers();
            const mimeType = mime.getType(url.pathname);
            if (mimeType) {
                headers.set('Content-Type', `${mimeType};charset=utf-8`);
            } else {
                headers.set('Content-Type', 'text/plain;charset=utf-8');
            }
            const bytes =
                response.encoding !== 'binary' ? this.encoder.encode(response.body) : response.body;
            // @ts-expect-error Not sure why this 
            headers.set('Content-Length', bytes.byteLength.toString());

            const newResponse = new Response(bytes, {
                status: 200,
                headers,
            });
            attachCookiesToResponse(newResponse, response.cookies);
            return newResponse;
        }
    }
}
