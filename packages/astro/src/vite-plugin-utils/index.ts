const postfixRE = /[?#].*$/s;
export function cleanUrl(url: string): string {
	return url.replace(postfixRE, '');
}
