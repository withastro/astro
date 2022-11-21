import type { SSRManifest } from "astro"
import type {
	CloudFrontRequestEvent,
	CloudFrontRequestResult,
	CloudFrontHeaders,
} from "aws-lambda"
import { NodeApp } from "astro/app/node"
import { polyfill } from "@astrojs/webapi"
import { isBinaryContentType } from "../lib/binary.js"

polyfill(globalThis, {
	exclude: "window document",
})

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest)

	return {
		async handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
			// Convert CloudFront request to Node request
			const { uri, method, headers, querystring, body } = event.Records[0].cf.request;
			const requestHeaders = new Headers()
			for (const [key, values] of Object.entries(headers)) {
				for (const { value } of values) {
					if (value) {
						requestHeaders.append(key, value)
					}
				}
			}
			const host = headers["host"][0].value;
			const qs = querystring.length > 0 ? `?${querystring}` : "";
			const url = new URL(`${uri}${qs}`, `https://${host}`);
			const request = new Request(url.toString(), {
				method,
				headers: requestHeaders,
				body: body?.data
					? body.encoding === "base64"
						? Buffer.from(body.data, "base64").toString()
						: body.data
					: undefined,
			});

			// Process request
			const rendered = await app.render(request);

			// Build cookies
			const responseHeaders: CloudFrontHeaders = {}
			const rawHeaders = rendered.headers.entries();
			for (const [key, value] of rawHeaders) {
				for (const v of value) {
					responseHeaders[key] = [...(responseHeaders[key] || []), { key, value: v }];
				}
			}

			// Convert Node response to CloudFront response
			const contentType = rendered.headers.get("content-type");
			const responseIsBase64Encoded = isBinaryContentType(contentType);
			return {
				status: String(rendered.status),
				statusDescription: "OK",
				headers: responseHeaders,
				bodyEncoding: responseIsBase64Encoded ? "base64" : "text",
				body: await rendered.text(),
			}
		}
	}
}