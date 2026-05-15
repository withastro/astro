const UnknownCompilerError = {
	name: 'UnknownCompilerError',
	title: 'Unknown compiler error.',
	hint: 'This is almost always a problem with the Astro compiler, not your code. Please open an issue at https://astro.build/issues/compiler.',
};
const ClientAddressNotAvailable = {
	name: 'ClientAddressNotAvailable',
	title: '`Astro.clientAddress` is not available in current adapter.',
	message: (adapterName) =>
		`\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`,
};
const PrerenderClientAddressNotAvailable = {
	name: 'PrerenderClientAddressNotAvailable',
	title: '`Astro.clientAddress` cannot be used inside prerendered routes.',
	message: (name) => `\`Astro.clientAddress\` cannot be used inside prerendered route ${name}`,
};
const StaticClientAddressNotAvailable = {
	name: 'StaticClientAddressNotAvailable',
	title: '`Astro.clientAddress` is not available in prerendered pages.',
	message: '`Astro.clientAddress` is only available on pages that are server-rendered.',
	hint: 'See https://docs.astro.build/en/guides/on-demand-rendering/ for more information on how to enable SSR.',
};
const NoMatchingStaticPathFound = {
	name: 'NoMatchingStaticPathFound',
	title: 'No static path found for requested path.',
	message: (pathName) =>
		`A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`,
	hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(', ')}.`,
};
const OnlyResponseCanBeReturned = {
	name: 'OnlyResponseCanBeReturned',
	title: 'Invalid type returned by Astro page.',
	message: (route, returnedValue) =>
		`Route \`${route ? route : ''}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`,
	hint: 'See https://docs.astro.build/en/guides/on-demand-rendering/#response for more information.',
};
const MissingMediaQueryDirective = {
	name: 'MissingMediaQueryDirective',
	title: 'Missing value for `client:media` directive.',
	message:
		'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided',
};
const NoMatchingRenderer = {
	name: 'NoMatchingRenderer',
	title: 'No matching renderer found.',
	message: (
		componentName,
		componentExtension,
		plural,
		validRenderersCount,
	) => `Unable to render \`${componentName}\`.

${
	validRenderersCount > 0
		? `There ${plural ? 'are' : 'is'} ${validRenderersCount} renderer${plural ? 's' : ''} configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render \`${componentName}\`.`
		: `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`
}`,
	hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/guides/framework-components/ for more information on how to install and configure integrations.`,
};
const NoClientEntrypoint = {
	name: 'NoClientEntrypoint',
	title: 'No client entrypoint specified in renderer.',
	message: (componentName, clientDirective, rendererName) =>
		`\`${componentName}\` component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by \`${rendererName}\`.`,
	hint: 'See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer.',
};
const NoClientOnlyHint = {
	name: 'NoClientOnlyHint',
	title: 'Missing hint on client:only directive.',
	message: (componentName) =>
		`Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
	hint: (probableRenderers) =>
		`Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`,
};
const InvalidGetStaticPathParam = {
	name: 'InvalidGetStaticPathParam',
	title: 'Invalid value returned by a `getStaticPaths` path.',
	message: (paramType) =>
		`Invalid params given to \`getStaticPaths\` path. Expected an \`object\`, got \`${paramType}\``,
	hint: 'See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths.',
};
const InvalidGetStaticPathsEntry = {
	name: 'InvalidGetStaticPathsEntry',
	title: "Invalid entry inside getStaticPath's return value",
	message: (entryType) =>
		`Invalid entry returned by getStaticPaths. Expected an object, got \`${entryType}\``,
	hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths.",
};
const InvalidGetStaticPathsReturn = {
	name: 'InvalidGetStaticPathsReturn',
	title: 'Invalid value returned by getStaticPaths.',
	message: (returnType) =>
		`Invalid type returned by \`getStaticPaths\`. Expected an \`array\`, got \`${returnType}\``,
	hint: 'See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths.',
};
const GetStaticPathsExpectedParams = {
	name: 'GetStaticPathsExpectedParams',
	title: 'Missing params property on `getStaticPaths` route.',
	message: 'Missing or empty required `params` property on `getStaticPaths` route.',
	hint: 'See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths.',
};
const GetStaticPathsInvalidRouteParam = {
	name: 'GetStaticPathsInvalidRouteParam',
	title: 'Invalid route parameter returned by `getStaticPaths()`.',
	message: (key, value, valueType) =>
		`Invalid \`getStaticPaths()\` route parameter for \`${key}\`. Expected a string or undefined, received \`${valueType}\` (\`${value}\`)`,
	hint: 'See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths.',
};
const GetStaticPathsRequired = {
	name: 'GetStaticPathsRequired',
	title: '`getStaticPaths()` function required for dynamic routes.',
	message:
		'`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.',
	hint: `See https://docs.astro.build/en/guides/routing/#dynamic-routes for more information on dynamic routes.

	If you meant for this route to be server-rendered, set \`export const prerender = false;\` in the page.`,
};
const ReservedSlotName = {
	name: 'ReservedSlotName',
	title: 'Invalid slot name.',
	message: (slotName) =>
		`Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`,
};
const NoAdapterInstalled = {
	name: 'NoAdapterInstalled',
	title: 'Cannot use Server-side Rendering without an adapter.',
	message: `Cannot use server-rendered pages without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
	hint: 'See https://docs.astro.build/en/guides/on-demand-rendering/ for more information.',
};
const AdapterSupportOutputMismatch = {
	name: 'AdapterSupportOutputMismatch',
	title: 'Adapter does not support server output.',
	message: (adapterName) =>
		`The \`${adapterName}\` adapter is configured to output a static website, but the project contains server-rendered pages. Please install and configure the appropriate server adapter for your final deployment.`,
};
const NoAdapterInstalledServerIslands = {
	name: 'NoAdapterInstalledServerIslands',
	title: 'Cannot use Server Islands without an adapter.',
	message: `Cannot use server islands without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
	hint: 'See https://docs.astro.build/en/guides/on-demand-rendering/ for more information.',
};
const NoMatchingImport = {
	name: 'NoMatchingImport',
	title: 'No import found for component.',
	message: (componentName) =>
		`Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`,
	hint: 'Please make sure the component is properly imported.',
};
const InvalidPrerenderExport = {
	name: 'InvalidPrerenderExport',
	title: 'Invalid prerender export.',
	message(prefix, suffix, isHydridOutput) {
		const defaultExpectedValue = isHydridOutput ? 'false' : 'true';
		let msg = `A \`prerender\` export has been detected, but its value cannot be statically analyzed.`;
		if (prefix !== 'const')
			msg += `
Expected \`const\` declaration but got \`${prefix}\`.`;
		if (suffix !== 'true')
			msg += `
Expected \`${defaultExpectedValue}\` value but got \`${suffix}\`.`;
		return msg;
	},
	hint: 'Mutable values declared at runtime are not supported. Please make sure to use exactly `export const prerender = true`.',
};
const InvalidComponentArgs = {
	name: 'InvalidComponentArgs',
	title: 'Invalid component arguments.',
	message: (name) => `Invalid arguments passed to${name ? ` <${name}>` : ''} component.`,
	hint: 'Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`.',
};
const PageNumberParamNotFound = {
	name: 'PageNumberParamNotFound',
	title: 'Page number param not found.',
	message: (paramName) =>
		`[paginate()] page number param \`${paramName}\` not found in your filepath.`,
	hint: 'Rename your file to `[page].astro` or `[...page].astro`.',
};
const ImageMissingAlt = {
	name: 'ImageMissingAlt',
	title: 'Image missing required "alt" property.',
	message:
		'Image missing "alt" property. "alt" text is required to describe important images on the page.',
	hint: 'Use an empty string ("") for decorative images.',
};
const InvalidImageService = {
	name: 'InvalidImageService',
	title: 'Error while loading image service.',
	message:
		'There was an error loading the configured image service. Please see the stack trace for more information.',
};
const MissingImageDimension = {
	name: 'MissingImageDimension',
	title: 'Missing image dimensions',
	message: (missingDimension, imageURL) =>
		`Missing ${missingDimension === 'both' ? 'width and height attributes' : `${missingDimension} attribute`} for ${imageURL}. When using remote images, both dimensions are required in order to avoid CLS.`,
	hint: 'If your image is inside your `src` folder, you probably meant to import it instead. See [the Imports guide for more information](https://docs.astro.build/en/guides/imports/#other-assets). You can also use `inferSize={true}` for remote images to get the original dimensions.',
};
const FailedToFetchRemoteImageDimensions = {
	name: 'FailedToFetchRemoteImageDimensions',
	title: 'Failed to retrieve remote image dimensions',
	message: (imageURL) => `Failed to get the dimensions for ${imageURL}.`,
	hint: 'Verify your remote image URL is accurate, and that you are not using `inferSize` with a file located in your `public/` folder.',
};
const RemoteImageNotAllowed = {
	name: 'RemoteImageNotAllowed',
	title: 'Remote image is not allowed',
	message: (imageURL) => `Remote image ${imageURL} is not allowed by your image configuration.`,
	hint: 'Update `image.domains` or `image.remotePatterns`, or remove `inferSize` for this image.',
};
const UnsupportedImageFormat = {
	name: 'UnsupportedImageFormat',
	title: 'Unsupported image format',
	message: (format, imagePath, supportedFormats) =>
		`Received unsupported format \`${format}\` from \`${imagePath}\`. Currently only ${supportedFormats.join(
			', ',
		)} are supported by our image services.`,
	hint: "Using an `img` tag directly instead of the `Image` component might be what you're looking for.",
};
const UnsupportedImageConversion = {
	name: 'UnsupportedImageConversion',
	title: 'Unsupported image conversion',
	message:
		'Converting between vector (such as SVGs) and raster (such as PNGs and JPEGs) images is not currently supported.',
};
const CannotOptimizeSvg = {
	name: 'CannotOptimizeSvg',
	title: 'Cannot optimize SVG',
	message: (path, name) =>
		`An error occurred while optimizing SVG file "${path}" with the "${name}" optimizer.`,
	hint: 'Review the included error message provided for guidance.',
};
const PrerenderDynamicEndpointPathCollide = {
	name: 'PrerenderDynamicEndpointPathCollide',
	title: 'Prerendered dynamic endpoint has path collision.',
	message: (pathname) =>
		`Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`,
	hint: (filename) =>
		`Rename \`${filename}\` to \`${filename.replace(/\.(?:js|ts)/, (m) => `.json` + m)}\``,
};
const PrerenderRouteConflict = {
	name: 'PrerenderRouteConflict',
	title: 'Prerendered route generates the same path as another route.',
	message: (winningRoute, thisRoute, pathname) =>
		`Could not render \`${pathname}\` from route \`${thisRoute}\` as it conflicts with higher priority route \`${winningRoute}\`.`,
	hint: (winningRoute, thisRoute) =>
		`Ensure \`${thisRoute}\` and \`${winningRoute}\` don't generate the same static paths.`,
};
const ExpectedImage = {
	name: 'ExpectedImage',
	title: 'Expected src to be an image.',
	message: (
		src,
		typeofOptions,
		fullOptions,
	) => `Expected \`src\` property for \`getImage\` or \`<Image />\` to be either an ESM imported image or a string with the path of a remote image. Received \`${src}\` (type: \`${typeofOptions}\`).

Full serialized options received: \`${fullOptions}\`.`,
	hint: "This error can often happen because of a wrong path. Make sure the path to your image is correct. If you're passing an async function, make sure to call and await it.",
};
const ExpectedImageOptions = {
	name: 'ExpectedImageOptions',
	title: 'Expected image options.',
	message: (options) => `Expected getImage() parameter to be an object. Received \`${options}\`.`,
};
const ExpectedNotESMImage = {
	name: 'ExpectedNotESMImage',
	title: 'Expected image options, not an ESM-imported image.',
	message:
		'An ESM-imported image cannot be passed directly to `getImage()`. Instead, pass an object with the image in the `src` property.',
	hint: 'Try changing `getImage(myImage)` to `getImage({ src: myImage })`',
};
const GetImageNotUsedOnServer = {
	name: 'GetImageNotUsedOnServer',
	title: '`getImage()` must be used on the server.',
	message:
		'`getImage()` should only be used on the server. To use images on the client, render the `src` from `getImage()` during the server render, then pass it to the client for usage.',
	hint: 'See https://docs.astro.build/en/reference/modules/astro-assets/#getimage for more information on getImage().',
};
const IncompatibleDescriptorOptions = {
	name: 'IncompatibleDescriptorOptions',
	title: 'Cannot set both `densities` and `widths`',
	message:
		"Only one of `densities` or `widths` can be specified. In most cases, you'll probably want to use only `widths` if you require specific widths.",
	hint: 'Those attributes are used to construct a `srcset` attribute, which cannot have both `x` and `w` descriptors.',
};
const ImageNotFound = {
	name: 'ImageNotFound',
	title: 'Image not found.',
	message: (imagePath) => `Could not find requested image \`${imagePath}\`. Does it exist?`,
	hint: 'This is often caused by a typo in the image path. Please make sure the file exists, and is spelled correctly.',
};
const NoImageMetadata = {
	name: 'NoImageMetadata',
	title: 'Could not process image metadata.',
	message: (imagePath) =>
		`Could not process image metadata${imagePath ? ` for \`${imagePath}\`` : ''}.`,
	hint: 'This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue.',
};
const CouldNotTransformImage = {
	name: 'CouldNotTransformImage',
	title: 'Could not transform image.',
	message: (imagePath) =>
		`Could not transform image \`${imagePath}\`. See the stack trace for more information.`,
	hint: 'This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue.',
};
const ResponseSentError = {
	name: 'ResponseSentError',
	title: 'Unable to set response.',
	message: 'The response has already been sent to the browser and cannot be altered.',
};
const MiddlewareNoDataOrNextCalled = {
	name: 'MiddlewareNoDataOrNextCalled',
	title: "The middleware didn't return a `Response`.",
	message:
		'Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function.',
};
const MiddlewareNotAResponse = {
	name: 'MiddlewareNotAResponse',
	title: 'The middleware returned something that is not a `Response` object.',
	message: 'Any data returned from middleware must be a valid `Response` object.',
};
const EndpointDidNotReturnAResponse = {
	name: 'EndpointDidNotReturnAResponse',
	title: 'The endpoint did not return a `Response`.',
	message:
		'An endpoint must return either a `Response`, or a `Promise` that resolves with a `Response`.',
};
const LocalsNotAnObject = {
	name: 'LocalsNotAnObject',
	title: 'Value assigned to `locals` is not accepted.',
	message:
		'`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.',
	hint: 'If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`.',
};
const LocalsReassigned = {
	name: 'LocalsReassigned',
	title: '`locals` must not be reassigned.',
	message: '`locals` cannot be assigned directly.',
	hint: 'Set a `locals` property instead.',
};
const AstroResponseHeadersReassigned = {
	name: 'AstroResponseHeadersReassigned',
	title: '`Astro.response.headers` must not be reassigned.',
	message:
		'Individual headers can be added to and removed from `Astro.response.headers`, but it must not be replaced with another instance of `Headers` altogether.',
	hint: 'Consider using `Astro.response.headers.add()`, and `Astro.response.headers.delete()`.',
};
const MiddlewareCantBeLoaded = {
	name: 'MiddlewareCantBeLoaded',
	title: "Can't load the middleware.",
	message: 'An unknown error was thrown while loading your middleware.',
};
const LocalImageUsedWrongly = {
	name: 'LocalImageUsedWrongly',
	title: 'Local images must be imported.',
	message: (imageFilePath) =>
		`\`Image\`'s and \`getImage\`'s \`src\` parameter must be an imported image or an URL, it cannot be a string filepath. Received \`${imageFilePath}\`.`,
	hint: 'If you want to use an image from your `src` folder, you need to either import it or if the image is coming from a content collection, use the [image() schema helper](https://docs.astro.build/en/guides/images/#images-in-content-collections). See https://docs.astro.build/en/guides/images/#src-required for more information on the `src` property.',
};
const AstroGlobUsedOutside = {
	name: 'AstroGlobUsedOutside',
	title: 'Astro.glob() used outside of an Astro file.',
	message: (globStr) =>
		`\`Astro.glob(${globStr})\` can only be used in \`.astro\` files. \`import.meta.glob(${globStr})\` can be used instead to achieve a similar result.`,
	hint: "See Vite's documentation on `import.meta.glob` for more information: https://vite.dev/guide/features.html#glob-import",
};
const AstroGlobNoMatch = {
	name: 'AstroGlobNoMatch',
	title: 'Astro.glob() did not match any files.',
	message: (globStr) => `\`Astro.glob(${globStr})\` did not return any matching files.`,
	hint: 'Check the pattern for typos.',
};
const RedirectWithNoLocation = {
	name: 'RedirectWithNoLocation',
	title: 'A redirect must be given a location with the `Location` header.',
};
const UnsupportedExternalRedirect = {
	name: 'UnsupportedExternalRedirect',
	title: 'Unsupported or malformed URL.',
	message: (from, to) =>
		`The destination URL in the external redirect from "${from}" to "${to}" is unsupported.`,
	hint: 'An external redirect must start with http or https, and must be a valid URL.',
};
const InvalidRedirectDestination = {
	name: 'InvalidRedirectDestination',
	title: 'Invalid redirect destination.',
	message: (from, to) =>
		`The redirect from "${from}" to "${to}" is invalid. The destination "${to}" does not match any existing route in your project.`,
	hint: 'If you are redirecting to a specific page of a dynamic route (e.g., "/posts/[slug]/1"), this is not supported. The destination must be either a static path or a route pattern that matches an existing page (e.g., "/posts/[slug]/[page]").',
};
const InvalidDynamicRoute = {
	name: 'InvalidDynamicRoute',
	title: 'Invalid dynamic route.',
	message: (route, invalidParam, received) =>
		`The ${invalidParam} param for route ${route} is invalid. Received **${received}**.`,
};
const MissingSharp = {
	name: 'MissingSharp',
	title: 'Could not find Sharp.',
	message:
		'Could not find Sharp. Please install Sharp (`sharp`) manually into your project or migrate to another image service.',
	hint: "See Sharp's installation instructions for more information: https://sharp.pixelplumbing.com/install. If you are not relying on `astro:assets` to optimize, transform, or process any images, you can configure a passthrough image service instead of installing Sharp. See https://docs.astro.build/en/reference/errors/missing-sharp for more information.\n\nSee https://docs.astro.build/en/guides/images/#default-image-service for more information on how to migrate to another image service.",
};
const UnknownViteError = {
	name: 'UnknownViteError',
	title: 'Unknown Vite Error.',
};
const FailedToLoadModuleSSR = {
	name: 'FailedToLoadModuleSSR',
	title: 'Could not import file.',
	message: (importName) => `Could not import \`${importName}\`.`,
	hint: 'This is often caused by a typo in the import path. Please make sure the file exists.',
};
const InvalidGlob = {
	name: 'InvalidGlob',
	title: 'Invalid glob pattern.',
	message: (globPattern) =>
		`Invalid glob pattern: \`${globPattern}\`. Glob patterns must start with './', '../' or '/'.`,
	hint: 'See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns.',
};
const FailedToFindPageMapSSR = {
	name: 'FailedToFindPageMapSSR',
	title: "Astro couldn't find the correct page to render",
	message:
		"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error. Please file an issue.",
};
const MissingLocale = {
	name: 'MissingLocaleError',
	title: 'The provided locale does not exist.',
	message: (locale) =>
		`The locale/path \`${locale}\` does not exist in the configured \`i18n.locales\`.`,
};
const MissingIndexForInternationalization = {
	name: 'MissingIndexForInternationalizationError',
	title: 'Index page not found.',
	message: (defaultLocale) =>
		`Could not find index page. A root index page is required in order to create a redirect to the index URL of the default locale. (\`/${defaultLocale}\`)`,
	hint: (src) => `Create an index page (\`index.astro, index.md, etc.\`) in \`${src}\`.`,
};
const IncorrectStrategyForI18n = {
	name: 'IncorrectStrategyForI18n',
	title: "You can't use the current function with the current strategy",
	message: (functionName) =>
		`The function \`${functionName}\` can only be used when the \`i18n.routing.strategy\` is set to \`"manual"\`.`,
};
const NoPrerenderedRoutesWithDomains = {
	name: 'NoPrerenderedRoutesWithDomains',
	title: "Prerendered routes aren't supported when internationalization domains are enabled.",
	message: (component) =>
		`Static pages aren't yet supported with multiple domains. To enable this feature, you must disable prerendering for the page ${component}`,
};
const MissingMiddlewareForInternationalization = {
	name: 'MissingMiddlewareForInternationalization',
	title: 'Enabled manual internationalization routing without having a middleware.',
	message:
		"Your configuration setting `i18n.routing: 'manual'` requires you to provide your own i18n `middleware` file.",
};
const InvalidI18nMiddlewareConfiguration = {
	name: 'InvalidI18nMiddlewareConfiguration',
	title: 'Invalid internationalization middleware configuration',
	message:
		'The option `redirectToDefaultLocale` can be enabled only when `prefixDefaultLocale` is also set to `true`; otherwise, redirects might cause infinite loops. Enable the option `prefixDefaultLocale` to continue to use `redirectToDefaultLocale`, or ensure both are set to `false`.',
};
const CantRenderPage = {
	name: 'CantRenderPage',
	title: "Astro can't render the route.",
	message:
		'Astro cannot find any content to render for this route. There is no file or redirect associated with this route.',
	hint: 'If you expect to find a route here, this may be an Astro bug. Please file an issue/restart the dev server',
};
const UnhandledRejection = {
	name: 'UnhandledRejection',
	title: 'Unhandled rejection',
	message: (stack) => `Astro detected an unhandled rejection. Here's the stack trace:
${stack}`,
	hint: 'Make sure your promises all have an `await` or a `.catch()` handler.',
};
const i18nNotEnabled = {
	name: 'i18nNotEnabled',
	title: 'i18n Not Enabled',
	message: 'The `astro:i18n` module cannot be used without enabling i18n in your Astro config.',
	hint: 'See https://docs.astro.build/en/guides/internationalization for a guide on setting up i18n.',
};
const i18nNoLocaleFoundInPath = {
	name: 'i18nNoLocaleFoundInPath',
	title: "The path doesn't contain any locale",
	message:
		"You tried to use an i18n utility on a path that doesn't contain any locale. You can use `pathHasLocale` first to determine if the path has a locale.",
};
const RouteNotFound = {
	name: 'RouteNotFound',
	title: 'Route not found.',
	message: `Astro could not find a route that matches the one you requested.`,
};
const EnvInvalidVariables = {
	name: 'EnvInvalidVariables',
	title: 'Invalid Environment Variables',
	message: (errors) => `The following environment variables defined in \`env.schema\` are invalid:

${errors.map((err) => `- ${err}`).join('\n')}
`,
};
const EnvPrefixConflictsWithSecret = {
	name: 'EnvPrefixConflictsWithSecret',
	title: 'envPrefix conflicts with secret environment variables',
	message: (
		conflicts,
	) => `The following environment variables are declared with \`access: "secret"\` in \`env.schema\`, but their names match a prefix in \`vite.envPrefix\`, which would expose them in client-side bundles:

${conflicts.map((c) => `- ${c}`).join('\n')}

Either remove the conflicting prefixes from \`vite.envPrefix\`, or rename these variables to use a prefix not in \`vite.envPrefix\`.`,
};
const ServerOnlyModule = {
	name: 'ServerOnlyModule',
	title: 'Module is only available server-side',
	message: (name) => `The "${name}" module is only available server-side.`,
};
const RewriteWithBodyUsed = {
	name: 'RewriteWithBodyUsed',
	title: 'Cannot use Astro.rewrite after the request body has been read',
	message:
		'Astro.rewrite() cannot be used if the request body has already been read. If you need to read the body, first clone the request.',
};
const ForbiddenRewrite = {
	name: 'ForbiddenRewrite',
	title: 'Forbidden rewrite to a static route.',
	message: (
		from,
		to,
		component,
	) => `You tried to rewrite the on-demand route '${from}' with the static route '${to}', when using the 'server' output. 

The static route '${to}' is rendered by the component
'${component}', which is marked as prerendered. This is a forbidden operation because during the build, the component '${component}' is compiled to an
HTML file, which can't be retrieved at runtime by Astro.`,
	hint: (component) =>
		`Add \`export const prerender = false\` to the component '${component}', or use a Astro.redirect().`,
};
const UnknownFilesystemError = {
	name: 'UnknownFilesystemError',
	title: 'An unknown error occurred while reading or writing files to disk.',
	hint: 'It can be caused by many things, eg. missing permissions or a file not existing we attempt to read. Check the error cause for more details.',
};
const CannotExtractFontType = {
	name: 'CannotExtractFontType',
	title: 'Cannot extract the font type from the given URL.',
	message: (url) => `An error occurred while trying to extract the font type from ${url}`,
	hint: 'Open an issue at https://github.com/withastro/astro/issues.',
};
const CannotDetermineWeightAndStyleFromFontFile = {
	name: 'CannotDetermineWeightAndStyleFromFontFile',
	title: 'Cannot determine weight and style from font file.',
	message: (family, url) =>
		`An error occurred while determining the \`weight\` and \`style\` from local family "${family}" font file: ${url}`,
	hint: 'Update your family config and set `weight` and `style` manually instead.',
};
const CannotFetchFontFile = {
	name: 'CannotFetchFontFile',
	title: 'Cannot fetch the given font file.',
	message: (url) => `An error occurred while fetching the font file from ${url}`,
	hint: 'This is often caused by connectivity issues. If the error persists, open an issue at https://github.com/withastro/astro/issues.',
};
const FontFamilyNotFound = {
	name: 'FontFamilyNotFound',
	title: 'Font family not found',
	message: (family) =>
		`No data was found for the \`"${family}"\` family passed to the \`<Font>\` component.`,
	hint: 'This is often caused by a typo. Check that the `<Font />` component is using a `cssVariable` specified in your config.',
};
const FontFileUrlNotFound = {
	name: 'FontFileUrlNotFound',
	title: 'Font file URL not found',
	message: (url) =>
		`The \`"${url}"\` URL passed to the \`experimental_getFontFileURL()\` function is invalid.`,
	hint: 'Make sure you pass a valid URL, obtained via the `fontData` object.',
};
const MissingGetFontFileRequestUrl = {
	name: 'MissingGetFontFileRequestUrl',
	title: '`experimental_getFontFileURL()` requires the request URL with on-demand rendering.',
	hint: 'Pass the request URL as the 2nd argument, for example `Astro.url`.',
};
const UnavailableAstroGlobal = {
	name: 'UnavailableAstroGlobal',
	title: 'Unavailable Astro global in getStaticPaths()',
	message: (name) =>
		`The Astro global is not available in this scope. Please remove "Astro.${name}" from your getStaticPaths() function.`,
};
const UnableToLoadLogger = {
	name: 'UnableToLoadLogger',
	title: 'Unable to load the logger.',
	message: (path) => `Couldn't load the logger at given path "${path}".`,
};
const LoggerConfigurationNotSerializable = {
	name: 'LoggerConfigurationNotSerializable',
	title: 'The configuration of the logger is not serializable',
};
const UnknownCSSError = {
	name: 'UnknownCSSError',
	title: 'Unknown CSS Error.',
};
const CSSSyntaxError = {
	name: 'CSSSyntaxError',
	title: 'CSS Syntax Error.',
};
const UnknownMarkdownError = {
	name: 'UnknownMarkdownError',
	title: 'Unknown Markdown Error.',
};
const MarkdownFrontmatterParseError = {
	name: 'MarkdownFrontmatterParseError',
	title: 'Failed to parse Markdown frontmatter.',
};
const InvalidFrontmatterInjectionError = {
	name: 'InvalidFrontmatterInjectionError',
	title: 'Invalid frontmatter injection.',
	message:
		'A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.',
	hint: 'See the frontmatter injection docs https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically for more information.',
};
const MdxIntegrationMissingError = {
	name: 'MdxIntegrationMissingError',
	title: 'MDX integration missing.',
	message: (file) =>
		`Unable to render ${file}. Ensure that the \`@astrojs/mdx\` integration is installed.`,
	hint: 'See the MDX integration docs for installation and usage instructions: https://docs.astro.build/en/guides/integrations-guide/mdx/',
};
const UnknownConfigError = {
	name: 'UnknownConfigError',
	title: 'Unknown configuration error.',
};
const ConfigNotFound = {
	name: 'ConfigNotFound',
	title: 'Specified configuration file not found.',
	message: (configFile) => `Unable to resolve \`--config "${configFile}"\`. Does the file exist?`,
};
const ConfigLegacyKey = {
	name: 'ConfigLegacyKey',
	title: 'Legacy configuration detected.',
	message: (legacyConfigKey) => `Legacy configuration detected: \`${legacyConfigKey}\`.`,
	hint: 'Please update your configuration to the new format.\nSee https://astro.build/config for more information.',
};
const UnknownCLIError = {
	name: 'UnknownCLIError',
	title: 'Unknown CLI Error.',
};
const GenerateContentTypesError = {
	name: 'GenerateContentTypesError',
	title: 'Failed to generate content types.',
	message: (errorMessage) =>
		`\`astro sync\` command failed to generate content collection types: ${errorMessage}`,
	hint: (fileName) =>
		`This error is often caused by a syntax error inside your content, or your content configuration file. Check your ${fileName ?? 'content config'} file for typos.`,
};
const UnknownContentCollectionError = {
	name: 'UnknownContentCollectionError',
	title: 'Unknown Content Collection Error.',
};
const RenderUndefinedEntryError = {
	name: 'RenderUndefinedEntryError',
	title: 'Attempted to render an undefined content collection entry.',
	hint: 'Check if the entry is undefined before passing it to `render()`',
};
const GetEntryDeprecationError = {
	name: 'GetEntryDeprecationError',
	title: 'Invalid use of `getDataEntryById` or `getEntryBySlug` function.',
	message: (collection, method) =>
		`The \`${method}\` function is deprecated and cannot be used to query the "${collection}" collection. Use \`getEntry\` instead.`,
	hint: 'See https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections for more information.',
};
const InvalidContentEntryFrontmatterError = {
	name: 'InvalidContentEntryFrontmatterError',
	title: 'Content entry frontmatter does not match schema.',
	message(collection, entryId, error) {
		return [
			`**${String(collection)} \u2192 ${String(
				entryId,
			)}** frontmatter does not match collection schema.`,
			...error.issues.map((issue) => `  **${issue.path.join('.')}**: ${issue.message}`),
		].join('\n');
	},
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas.',
};
const InvalidContentEntryDataError = {
	name: 'InvalidContentEntryDataError',
	title: 'Content entry data does not match schema.',
	message(collection, entryId, error) {
		return [
			`**${String(collection)} \u2192 ${String(entryId)}** data does not match collection schema.
`,
			...error.issues.map((issue) => `  **${issue.path.join('.')}**: ${issue.message}`),
			'',
		].join('\n');
	},
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas.',
};
const LegacyContentConfigError = {
	name: 'LegacyContentConfigError',
	title: 'Legacy content config file found.',
	message: (filename) =>
		`Found legacy content config file in "${filename}". Please move this file to "src/content.config.${filename.split('.').at(-1)}" and ensure each collection has a loader defined.`,
	hint: 'See https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections for more information on updating collections.',
};
const ContentCollectionMissingLoader = {
	name: 'ContentCollectionMissingLoader',
	title: 'Content collection is missing a `loader` definition.',
	message: (file = 'your content config file') =>
		`Collections must have a \`loader\` defined. Check your collection definitions in ${file}.`,
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more information on content loaders and https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections for more information on migrating from legacy collections.',
};
const ContentCollectionInvalidType = {
	name: 'ContentCollectionInvalidType',
	title: 'Content collection has an invalid `type` field.',
	message: (type, file = 'your content config file') =>
		`Invalid collection type "${type}". Remove the type from your collection definition in ${file}.`,
	hint: 'See https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections for more information on migrating from legacy collections.',
};
const ContentLoaderReturnsInvalidId = {
	name: 'ContentLoaderReturnsInvalidId',
	title: 'Content loader returned an entry with an invalid `id`.',
	message(collection, entry) {
		return [
			`The content loader for the collection **${String(collection)}** returned an entry with an invalid \`id\`:`,
			JSON.stringify(entry, null, 2),
		].join('\n');
	},
	hint: 'Make sure that the `id` of the entry is a string. See https://docs.astro.build/en/guides/content-collections/ for more information on content loaders.',
};
const ContentEntryDataError = {
	name: 'ContentEntryDataError',
	title: 'Content entry data does not match schema.',
	message(collection, entryId, error) {
		return [
			`**${String(collection)} \u2192 ${String(entryId)}** data does not match collection schema.
`,
			...error.issues.map((issue) => `  **${issue.path.join('.')}**: ${issue.message}`),
			'',
		].join('\n');
	},
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas.',
};
const LiveContentConfigError = {
	name: 'LiveContentConfigError',
	title: 'Error in live content config.',
	message: (error, filename) =>
		`${error} Check your collection definitions in ${filename ?? 'your live content config file'}.`,
	hint: 'See https://docs.astro.build/en/reference/modules/astro-content/#definelivecollection for more information on defining live content collections.',
};
const ContentLoaderInvalidDataError = {
	name: 'ContentLoaderInvalidDataError',
	title: 'Content entry is missing an ID',
	message(collection, extra) {
		return `**${String(collection)}** entry is missing an ID.
${extra}`;
	},
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more information on content loaders.',
};
const InvalidContentEntrySlugError = {
	name: 'InvalidContentEntrySlugError',
	title: 'Invalid content entry slug.',
	message(collection, entryId) {
		return `${String(collection)} \u2192 ${String(
			entryId,
		)} has an invalid slug. \`slug\` must be a string.`;
	},
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field.',
};
const ContentSchemaContainsSlugError = {
	name: 'ContentSchemaContainsSlugError',
	title: 'Content Schema should not contain `slug`.',
	message: (collectionName) =>
		`A content collection schema should not contain \`slug\` since it is reserved for slug generation. Remove this from your ${collectionName} collection schema.`,
	hint: 'See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field.',
};
const MixedContentDataCollectionError = {
	name: 'MixedContentDataCollectionError',
	title: 'Content and data cannot be in same collection.',
	message: (collectionName) =>
		`**${collectionName}** contains a mix of content and data entries. All entries must be of the same type.`,
	hint: 'Store data entries in a new collection separate from your content collection.',
};
const ContentCollectionTypeMismatchError = {
	name: 'ContentCollectionTypeMismatchError',
	title: 'Collection contains entries of a different type.',
	message: (collection, expectedType, actualType) =>
		`${collection} contains ${expectedType} entries, but is configured as a ${actualType} collection.`,
};
const DataCollectionEntryParseError = {
	name: 'DataCollectionEntryParseError',
	title: 'Data collection entry failed to parse.',
	message(entryId, errorMessage) {
		return `**${entryId}** failed to parse: ${errorMessage}`;
	},
	hint: 'Ensure your data entry is an object with valid JSON (for `.json` entries), YAML (for `.yaml` entries) or TOML (for `.toml` entries).',
};
const DuplicateContentEntrySlugError = {
	name: 'DuplicateContentEntrySlugError',
	title: 'Duplicate content entry slug.',
	message(collection, slug, preExisting, alsoFound) {
		return `**${collection}** contains multiple entries with the same slug: \`${slug}\`. Slugs must be unique.

Entries: 
- ${preExisting}
- ${alsoFound}`;
	},
};
const UnsupportedConfigTransformError = {
	name: 'UnsupportedConfigTransformError',
	title: 'Unsupported transform in content config.',
	message: (
		parseError,
	) => `\`transform()\` functions in your content config must return valid JSON, or data types compatible with the devalue library (including Dates, Maps, and Sets).
Full error: ${parseError}`,
	hint: 'See the devalue library for all supported types: https://github.com/rich-harris/devalue',
};
const FileParserNotFound = {
	name: 'FileParserNotFound',
	title: 'File parser not found',
	message: (fileName) =>
		`No parser was found for '${fileName}'. Pass a parser function (e.g. \`parser: csv\`) to the \`file\` loader.`,
};
const FileGlobNotSupported = {
	name: 'FileGlobNotSupported',
	title: 'Glob patterns are not supported in the file loader',
	message: 'Glob patterns are not supported in the `file` loader. Use the `glob` loader instead.',
	hint: `See Astro's file loader https://docs.astro.build/en/reference/content-loader-reference/#file-loader for supported usage.`,
};
const ActionsWithoutServerOutputError = {
	name: 'ActionsWithoutServerOutputError',
	title: 'Actions must be used with server output.',
	message:
		'A server is required to create callable backend functions. To deploy routes to a server, add an adapter to your Astro config and configure your route for on-demand rendering',
	hint: 'Add an adapter and enable on-demand rendering: https://docs.astro.build/en/guides/on-demand-rendering/',
};
const ActionsReturnedInvalidDataError = {
	name: 'ActionsReturnedInvalidDataError',
	title: 'Action handler returned invalid data.',
	message: (error) =>
		`Action handler returned invalid data. Handlers should return serializable data types like objects, arrays, strings, and numbers. Parse error: ${error}`,
	hint: 'See the devalue library for all supported types: https://github.com/rich-harris/devalue',
};
const ActionNotFoundError = {
	name: 'ActionNotFoundError',
	title: 'Action not found.',
	message: (actionName) =>
		`The server received a request for an action named \`${actionName}\` but could not find a match. If you renamed an action, check that you've updated your \`actions/index\` file and your calling code to match.`,
	hint: 'You can run `astro check` to detect type errors caused by mismatched action names.',
};
const ActionCalledFromServerError = {
	name: 'ActionCalledFromServerError',
	title: 'Action unexpected called from the server.',
	message:
		'Action called from a server page or endpoint without using `Astro.callAction()`. This wrapper must be used to call actions from server code.',
	hint: 'See the `Astro.callAction()` reference for usage examples: https://docs.astro.build/en/reference/api-reference/#callaction',
};
const UnknownError = { name: 'UnknownError', title: 'Unknown Error.' };
const ActionsCantBeLoaded = {
	name: 'ActionsCantBeLoaded',
	title: "Can't load the Astro actions.",
	message: 'An unknown error was thrown while loading the Astro actions file.',
};
const SessionStorageInitError = {
	name: 'SessionStorageInitError',
	title: 'Session storage could not be initialized.',
	message: (error, driver) =>
		`Error when initializing session storage${driver ? ` with driver \`${driver}\`` : ''}. \`${error ?? ''}\``,
	hint: 'For more information, see https://docs.astro.build/en/guides/sessions/',
};
const SessionStorageSaveError = {
	name: 'SessionStorageSaveError',
	title: 'Session data could not be saved.',
	message: (error, driver) =>
		`Error when saving session data${driver ? ` with driver \`${driver}\`` : ''}. \`${error ?? ''}\``,
	hint: 'For more information, see https://docs.astro.build/en/guides/sessions/',
};
const CacheProviderNotFound = {
	name: 'CacheProviderNotFound',
	title: 'Cache provider not found.',
	message: (provider) =>
		`Could not resolve the cache provider \`${provider}\`. Make sure the package is installed.`,
	hint: "If your adapter provides a default cache provider, you may not need to set one explicitly. Check your adapter's documentation.",
};
const CacheNotEnabled = {
	name: 'CacheNotEnabled',
	title: 'Cache is not enabled.',
	message:
		'`Astro.cache` is not available because the cache feature is not enabled. To use caching, configure a cache provider in your Astro config under `experimental.cache`.',
	hint: 'Use an adapter that provides a default cache provider, or set one explicitly: `experimental: { cache: { provider: "..." } }`. See https://docs.astro.build/en/reference/experimental-flags/route-caching/.',
};
const CacheQueryConfigConflict = {
	name: 'CacheQueryConfigConflict',
	title: 'Conflicting cache query configuration.',
	message:
		'`query.include` and `query.exclude` cannot be used together. Use `include` to allowlist specific parameters, or `exclude` to blocklist them.',
	hint: 'When using `include`, all parameters not in the list are automatically excluded, making `exclude` redundant.',
};
export {
	ActionCalledFromServerError,
	ActionNotFoundError,
	ActionsCantBeLoaded,
	ActionsReturnedInvalidDataError,
	ActionsWithoutServerOutputError,
	AdapterSupportOutputMismatch,
	AstroGlobNoMatch,
	AstroGlobUsedOutside,
	AstroResponseHeadersReassigned,
	CSSSyntaxError,
	CacheNotEnabled,
	CacheProviderNotFound,
	CacheQueryConfigConflict,
	CannotDetermineWeightAndStyleFromFontFile,
	CannotExtractFontType,
	CannotFetchFontFile,
	CannotOptimizeSvg,
	CantRenderPage,
	ClientAddressNotAvailable,
	ConfigLegacyKey,
	ConfigNotFound,
	ContentCollectionInvalidType,
	ContentCollectionMissingLoader,
	ContentCollectionTypeMismatchError,
	ContentEntryDataError,
	ContentLoaderInvalidDataError,
	ContentLoaderReturnsInvalidId,
	ContentSchemaContainsSlugError,
	CouldNotTransformImage,
	DataCollectionEntryParseError,
	DuplicateContentEntrySlugError,
	EndpointDidNotReturnAResponse,
	EnvInvalidVariables,
	EnvPrefixConflictsWithSecret,
	ExpectedImage,
	ExpectedImageOptions,
	ExpectedNotESMImage,
	FailedToFetchRemoteImageDimensions,
	FailedToFindPageMapSSR,
	FailedToLoadModuleSSR,
	FileGlobNotSupported,
	FileParserNotFound,
	FontFamilyNotFound,
	FontFileUrlNotFound,
	ForbiddenRewrite,
	GenerateContentTypesError,
	GetEntryDeprecationError,
	GetImageNotUsedOnServer,
	GetStaticPathsExpectedParams,
	GetStaticPathsInvalidRouteParam,
	GetStaticPathsRequired,
	ImageMissingAlt,
	ImageNotFound,
	IncompatibleDescriptorOptions,
	IncorrectStrategyForI18n,
	InvalidComponentArgs,
	InvalidContentEntryDataError,
	InvalidContentEntryFrontmatterError,
	InvalidContentEntrySlugError,
	InvalidDynamicRoute,
	InvalidFrontmatterInjectionError,
	InvalidGetStaticPathParam,
	InvalidGetStaticPathsEntry,
	InvalidGetStaticPathsReturn,
	InvalidGlob,
	InvalidI18nMiddlewareConfiguration,
	InvalidImageService,
	InvalidPrerenderExport,
	InvalidRedirectDestination,
	LegacyContentConfigError,
	LiveContentConfigError,
	LocalImageUsedWrongly,
	LocalsNotAnObject,
	LocalsReassigned,
	LoggerConfigurationNotSerializable,
	MarkdownFrontmatterParseError,
	MdxIntegrationMissingError,
	MiddlewareCantBeLoaded,
	MiddlewareNoDataOrNextCalled,
	MiddlewareNotAResponse,
	MissingGetFontFileRequestUrl,
	MissingImageDimension,
	MissingIndexForInternationalization,
	MissingLocale,
	MissingMediaQueryDirective,
	MissingMiddlewareForInternationalization,
	MissingSharp,
	MixedContentDataCollectionError,
	NoAdapterInstalled,
	NoAdapterInstalledServerIslands,
	NoClientEntrypoint,
	NoClientOnlyHint,
	NoImageMetadata,
	NoMatchingImport,
	NoMatchingRenderer,
	NoMatchingStaticPathFound,
	NoPrerenderedRoutesWithDomains,
	OnlyResponseCanBeReturned,
	PageNumberParamNotFound,
	PrerenderClientAddressNotAvailable,
	PrerenderDynamicEndpointPathCollide,
	PrerenderRouteConflict,
	RedirectWithNoLocation,
	RemoteImageNotAllowed,
	RenderUndefinedEntryError,
	ReservedSlotName,
	ResponseSentError,
	RewriteWithBodyUsed,
	RouteNotFound,
	ServerOnlyModule,
	SessionStorageInitError,
	SessionStorageSaveError,
	StaticClientAddressNotAvailable,
	UnableToLoadLogger,
	UnavailableAstroGlobal,
	UnhandledRejection,
	UnknownCLIError,
	UnknownCSSError,
	UnknownCompilerError,
	UnknownConfigError,
	UnknownContentCollectionError,
	UnknownError,
	UnknownFilesystemError,
	UnknownMarkdownError,
	UnknownViteError,
	UnsupportedConfigTransformError,
	UnsupportedExternalRedirect,
	UnsupportedImageConversion,
	UnsupportedImageFormat,
	i18nNoLocaleFoundInPath,
	i18nNotEnabled,
};
