import type { Params } from '../../@types/astro';
import '../polyfill.js';
import { canonicalURL as getCanonicalURL } from '../util.js';

type Site = URL | undefined;

interface RequestOptions {
	input: RequestInfo;
	init?: RequestInit;
	site: Site;
	params?: Params | undefined;
}

export class AstroRequest extends Request {
	public site: Site;
	public params: Params | undefined;

	constructor(opts: RequestOptions) {
		super(opts.input, opts.init);
		this.site = opts.site;
		this.params = opts.params;
	}

	get canonicalURL(): URL {
		let url = new URL(this.url);
		let { pathname, origin } = url;
		return getCanonicalURL('.' + pathname, this.site?.toString() ?? origin);
	}
}
