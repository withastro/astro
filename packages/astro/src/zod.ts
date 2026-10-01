import * as mod from 'zod/v4';

export * from 'zod/v4';

// TODO: remove in Astro 8
export {
	/**
	 * @deprecated
	 * `import { z } from 'astro/zod'` is deprecated and will be removed
	 * in Astro 8. Install `zod` and use `import { z } from 'zod'` instead.
	 */
	mod as z,
};

// TODO: remove in Astro 8
/**
 * @deprecated
 * `import zod from 'astro/zod'` is deprecated and will be removed
 * in Astro 8. Install `zod` and use `import { z } from 'zod'` instead.
 */
export default mod;
