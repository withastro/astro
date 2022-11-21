import type { SSRManifest } from "astro"
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda"
import { NodeApp } from "astro/app/node"
import { polyfill } from "@astrojs/webapi"
import { isBinaryContentType } from "../lib/binary.js"

polyfill(globalThis, {
	exclude: "window document",
})

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest)

	return {
		async handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
			const {
				body,
				headers,
				rawPath,
				rawQueryString,
				requestContext,
				isBase64Encoded,
			} = event;

			// Convert API Gateway request to Node request
			const scheme = headers["x-forwarded-protocol"] || "https";
			const host = headers["x-forwarded-host"] || headers.host;
			const qs = rawQueryString.length > 0 ? `?${rawQueryString}` : "";
			const url = new URL(`${rawPath}${qs}`, `${scheme}://${host}`)
			const encoding = isBase64Encoded ? "base64" : "utf8";
			const request = new Request(url.toString(), {
				method: requestContext.http.method,
				headers: new Headers(headers as any),
				body: typeof body === "string"
					? Buffer.from(body, encoding)
					: body,
			})

			// Process request
			const rendered = await app.render(request)

			// Build cookies
			// note: AWS API Gateway will send back set-cookies outside of response headers
			const responseCookies = Array.from(rendered.headers.entries())
				.filter(([key]) => key === "set-cookie")
				.map(([_, value]) => value);
			if (responseCookies.length) {
				rendered.headers.delete("set-cookie");
			}

			// Convert Node response to API Gateway response
			const contentType = rendered.headers.get("content-type");
			const responseIsBase64Encoded = isBinaryContentType(contentType);
			return {
				statusCode: rendered.status,
				headers: Object.fromEntries(rendered.headers.entries()),
				cookies: responseCookies,
				body: responseIsBase64Encoded
					? Buffer.from(await rendered.arrayBuffer()).toString("base64")
					: await rendered.text(),
				isBase64Encoded: responseIsBase64Encoded,
			}
		},
	}
}