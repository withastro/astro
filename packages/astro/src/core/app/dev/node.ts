import type { RenderOptions } from '../base.js';
import { NodeApp } from '../node.js';
import type { NodeAppDef, NodeAppHeadersJson, NodeRequest } from '../types.js';
import { DevApp } from './app.js';

export class DevNodeApp extends DevApp implements NodeAppDef {
	headersMap: NodeAppHeadersJson | undefined = undefined;

	public setHeadersMap(headers: NodeAppHeadersJson) {
		this.headersMap = headers;
	}

	match(req: NodeRequest | Request) {
		if (!(req instanceof Request)) {
			req = NodeApp.createRequest(req, {
				skipBody: true,
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.match(req);
	}

	render(request: NodeRequest | Request, options?: RenderOptions): Promise<Response> {
		if (!(request instanceof Request)) {
			request = NodeApp.createRequest(request, {
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.render(request, options);
	}
}
