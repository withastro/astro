import colors from 'piccolore';

const { blue, dim, red, yellow } = colors;

/** Display each request being served with the path and the status code.  */
export function req({
	url,
	method,
	statusCode,
	reqTime,
	isRewrite,
}: {
	url: string;
	statusCode: number;
	method?: string;
	reqTime?: number;
	isRewrite?: boolean;
}): string {
	const color = statusCode >= 500 ? red : statusCode >= 300 ? yellow : blue;
	return (
		color(`[${statusCode}]`) +
		` ` +
		`${isRewrite ? color('(rewrite) ') : ''}` +
		(method && method !== 'GET' ? color(method) + ' ' : '') +
		url +
		` ` +
		(reqTime ? dim(Math.round(reqTime) + 'ms') : '')
	);
}
