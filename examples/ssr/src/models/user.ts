import lightcookie from 'lightcookie';

export function isLoggedIn(request: Request): boolean {
	const cookie = request.headers.get('cookie');
	const parsed = lightcookie.parse(cookie);
	return 'user-id' in parsed;
}
