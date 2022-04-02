import { encode } from 'html-entities';
import { baseCSS } from './css.js';

interface ErrorTemplateOptions {
	/** a short description of the error */
	pathname: string;
	/** HTTP error code */
	statusCode?: number;
	/** HTML <title> */
	tabTitle: string;
	/** page title */
	title: string;
	/** The body of the message, if one is provided */
	body?: string;
}

/** Display all errors */
export default function template({
	title,
	pathname,
	statusCode = 404,
	tabTitle,
	body,
}: ErrorTemplateOptions): string {
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>${tabTitle}</title>
		<style>
			${baseCSS}

			.center {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				width: 100vw;
			}

			.statusCode {
				color: var(--orange);
			}

			.astro {
				height: 120px;
				width: 120px;
			}
		</style>
	</head>
	<body>
		<main class="center">
			<svg class="astro" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M163.008 18.929c1.944 2.413 2.935 5.67 4.917 12.181l43.309 142.27a180.277 180.277 0 00-51.778-17.53l-28.198-95.29a3.67 3.67 0 00-7.042.01l-27.857 95.232a180.225 180.225 0 00-52.01 17.557l43.52-142.281c1.99-6.502 2.983-9.752 4.927-12.16a15.999 15.999 0 016.484-4.798c2.872-1.154 6.271-1.154 13.07-1.154h31.085c6.807 0 10.211 0 13.086 1.157a16.004 16.004 0 016.487 4.806z" fill="white"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M168.19 180.151c-7.139 6.105-21.39 10.268-37.804 10.268-20.147 0-37.033-6.272-41.513-14.707-1.602 4.835-1.961 10.367-1.961 13.902 0 0-1.056 17.355 11.015 29.426 0-6.268 5.081-11.349 11.349-11.349 10.743 0 10.731 9.373 10.721 16.977v.679c0 11.542 7.054 21.436 17.086 25.606a23.27 23.27 0 01-2.339-10.2c0-11.008 6.463-15.107 13.974-19.87 5.976-3.79 12.616-8.001 17.192-16.449a31.024 31.024 0 003.743-14.82c0-3.299-.513-6.479-1.463-9.463z" fill="#ff5d01"></path></svg>
			<h1>${
				statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ''
			}<span class="statusMessage">${title}</span></h1>
			${
				body ||
				`
				<pre>Path: ${encode(pathname)}</pre>
			`
			}
			</main>
	</body>
</html>`;
}

export function subpathNotUsedTemplate(base: string, pathname: string) {
	return template({
		pathname,
		statusCode: 404,
		title: 'Not found',
		tabTitle: '404: Not Found',
		body: `<p>In your <code>site</code> you have your base path set to <a href="${base}">${base}</a>. Do you want to go there instead?</p>
<p>Come to our <a href="https://astro.build/chat">Discord</a> if you need help.</p>`,
	});
}

export function notFoundTemplate(pathname: string, message = 'Not found') {
	return template({
		pathname,
		statusCode: 404,
		title: message,
		tabTitle: `404: ${message}`,
	});
}
