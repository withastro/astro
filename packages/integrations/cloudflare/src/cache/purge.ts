/**
 * Purges `tags` from the Workers Cache.
 *
 * `cache.purge()` resolves even when Cloudflare refuses the purge, for example
 * over the account's purge rate limit, and reports the refusal in its result:
 * https://developers.cloudflare.com/workers/cache/purge/#return-value
 *
 * @throws {Error} When the result has `success: false`. The error's `cause`
 * holds the `errors` that Cloudflare returned.
 */
export async function purgeTags(cache: Pick<CacheContext, 'purge'>, tags: string[]): Promise<void> {
	const result = await cache.purge({ tags });
	if (!result.success) {
		const reasons = result.errors.map((error) => `${error.code} ${error.message}`).join('; ');
		throw new Error(`Cloudflare did not purge the cache tags: ${reasons || 'no reason given'}`, {
			cause: result.errors,
		});
	}
}
