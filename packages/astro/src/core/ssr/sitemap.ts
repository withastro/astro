const ERROR_STATUS_CODE_REGEXES = [
	/400\/?$/,
	/401\/?$/,
	/402\/?$/,
	/403\/?$/,
	/404\/?$/,
	/405\/?$/,
	/406\/?$/,
	/407\/?$/,
	/408\/?$/,
	/409\/?$/,
	/410\/?$/,
	/411\/?$/,
	/412\/?$/,
	/413\/?$/,
	/414\/?$/,
	/415\/?$/,
	/416\/?$/,
	/417\/?$/,
	/418\/?$/,
	/421\/?$/,
	/422\/?$/,
	/423\/?$/,
	/424\/?$/,
	/425\/?$/,
	/426\/?$/,
	/428\/?$/,
	/429\/?$/,
	/431\/?$/,
	/451\/?$/,
	/500\/?$/,
	/501\/?$/,
	/502\/?$/,
	/503\/?$/,
	/504\/?$/,
	/505\/?$/,
	/506\/?$/,
	/507\/?$/,
	/508\/?$/,
	/510\/?$/,
	/511\/?$/,
];

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(pages: string[]): string {
	// TODO: find way to respect <link rel="canonical"> URLs here

	// TODO: find way to exclude pages from sitemap

	// copy just in case original copy is needed
	// make sure that 404 page is excluded
	// also works for other error pages
	const urls = [...pages].filter((url) => !ERROR_STATUS_CODE_REGEXES.find((code) => code.test(url)));
	urls.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })); // sort alphabetically so sitemap is same each time
	let sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
	for (const url of urls) {
		sitemap += `<url><loc>${url}</loc></url>`;
	}
	sitemap += `</urlset>\n`;
	return sitemap;
}
