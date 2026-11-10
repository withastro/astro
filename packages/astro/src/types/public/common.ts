import type { BundledLanguage, LanguageRegistration, SpecialLanguage } from 'shiki';

export type {
	APIRoute,
	AstroMiddlewareInstance,
	GetStaticPaths,
	GetStaticPathsItem,
	GetStaticPathsOptions,
	GetStaticPathsResult,
	GetStaticPathsResultKeyed,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
	MiddlewareHandler,
	MiddlewareNext,
	Page,
	PaginateFunction,
	PaginateOptions,
	Params,
	Props,
	RewritePayload,
} from '@astrojs/vite-plugin-router';

export type CodeLanguage = BundledLanguage | LanguageRegistration | SpecialLanguage;

export type {
	AstroLoggerDestination,
	AstroLoggerLevel,
	AstroLoggerMessage,
} from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
