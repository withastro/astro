import { SQL } from 'drizzle-orm';
import * as z from 'zod/v4';
import { type SerializedSQL } from '../runtime/types.js';
import type { NumberColumn, TextColumn } from './types.js';
export type MaybeArray<T> = T | T[];
export declare const booleanColumnSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'boolean'>;
		schema: z.ZodObject<
			{
				label: z.ZodOptional<z.ZodString>;
				optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				name: z.ZodOptional<z.ZodString>;
				collection: z.ZodOptional<z.ZodString>;
				default: z.ZodOptional<
					z.ZodUnion<
						readonly [
							z.ZodBoolean,
							z.ZodPipe<z.ZodCustom<SQL<any>, SQL<any>>, z.ZodTransform<SerializedSQL, SQL<any>>>,
						]
					>
				>;
			},
			z.core.$strip
		>;
	},
	z.core.$strip
>;
declare const numberColumnBaseSchema: z.ZodIntersection<
	z.ZodObject<
		{
			name: z.ZodOptional<z.ZodString>;
			label: z.ZodOptional<z.ZodString>;
			unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
			deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
			collection: z.ZodOptional<z.ZodString>;
		},
		z.core.$strip
	>,
	z.ZodUnion<
		readonly [
			z.ZodObject<
				{
					primaryKey: z.ZodDefault<z.ZodOptional<z.ZodLiteral<false>>>;
					optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					default: z.ZodOptional<
						z.ZodUnion<
							readonly [
								z.ZodNumber,
								z.ZodPipe<z.ZodCustom<SQL<any>, SQL<any>>, z.ZodTransform<SerializedSQL, SQL<any>>>,
							]
						>
					>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					primaryKey: z.ZodLiteral<true>;
					optional: z.ZodOptional<z.ZodLiteral<false>>;
					default: z.ZodOptional<z.ZodLiteral<undefined>>;
				},
				z.core.$strip
			>,
		]
	>
>;
export declare const numberColumnOptsSchema: z.ZodType<
	z.infer<typeof numberColumnBaseSchema> & {
		references?: NumberColumn;
	},
	z.input<typeof numberColumnBaseSchema> & {
		references?: () => z.input<typeof numberColumnSchema>;
	}
>;
export declare const numberColumnSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'number'>;
		schema: z.ZodType<
			({
				unique: boolean;
				deprecated: boolean;
				name?: string | undefined;
				label?: string | undefined;
				collection?: string | undefined;
			} & (
				| {
						primaryKey: false;
						optional: boolean;
						default?: number | SerializedSQL | undefined;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
						default?: undefined;
				  }
			)) & {
				references?: NumberColumn;
			},
			({
				name?: string | undefined;
				label?: string | undefined;
				unique?: boolean | undefined;
				deprecated?: boolean | undefined;
				collection?: string | undefined;
			} & (
				| {
						primaryKey?: false | undefined;
						optional?: boolean | undefined;
						default?: number | SQL<any> | undefined;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
						default?: undefined;
				  }
			)) & {
				references?: () => z.input<typeof numberColumnSchema>;
			},
			z.core.$ZodTypeInternals<
				({
					unique: boolean;
					deprecated: boolean;
					name?: string | undefined;
					label?: string | undefined;
					collection?: string | undefined;
				} & (
					| {
							primaryKey: false;
							optional: boolean;
							default?: number | SerializedSQL | undefined;
					  }
					| {
							primaryKey: true;
							optional?: false | undefined;
							default?: undefined;
					  }
				)) & {
					references?: NumberColumn;
				},
				({
					name?: string | undefined;
					label?: string | undefined;
					unique?: boolean | undefined;
					deprecated?: boolean | undefined;
					collection?: string | undefined;
				} & (
					| {
							primaryKey?: false | undefined;
							optional?: boolean | undefined;
							default?: number | SQL<any> | undefined;
					  }
					| {
							primaryKey: true;
							optional?: false | undefined;
							default?: undefined;
					  }
				)) & {
					references?: () => z.input<typeof numberColumnSchema>;
				}
			>
		>;
	},
	z.core.$strip
>;
declare const textColumnBaseSchema: z.ZodIntersection<
	z.ZodObject<
		{
			name: z.ZodOptional<z.ZodString>;
			label: z.ZodOptional<z.ZodString>;
			unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
			deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
			collection: z.ZodOptional<z.ZodString>;
			default: z.ZodOptional<
				z.ZodUnion<
					readonly [
						z.ZodString,
						z.ZodPipe<z.ZodCustom<SQL<any>, SQL<any>>, z.ZodTransform<SerializedSQL, SQL<any>>>,
					]
				>
			>;
			multiline: z.ZodOptional<z.ZodBoolean>;
			enum: z.ZodOptional<z.ZodTuple<[z.ZodString], z.ZodString>>;
		},
		z.core.$strip
	>,
	z.ZodUnion<
		readonly [
			z.ZodObject<
				{
					primaryKey: z.ZodDefault<z.ZodOptional<z.ZodLiteral<false>>>;
					optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					primaryKey: z.ZodLiteral<true>;
					optional: z.ZodOptional<z.ZodLiteral<false>>;
				},
				z.core.$strip
			>,
		]
	>
>;
export declare const textColumnOptsSchema: z.ZodType<
	z.infer<typeof textColumnBaseSchema> & {
		references?: TextColumn;
	},
	z.input<typeof textColumnBaseSchema> & {
		references?: () => z.input<typeof textColumnSchema>;
	}
>;
export declare const textColumnSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'text'>;
		schema: z.ZodType<
			({
				unique: boolean;
				deprecated: boolean;
				name?: string | undefined;
				label?: string | undefined;
				collection?: string | undefined;
				default?: string | SerializedSQL | undefined;
				multiline?: boolean | undefined;
				enum?: [string, ...string[]] | undefined;
			} & (
				| {
						primaryKey: false;
						optional: boolean;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
				  }
			)) & {
				references?: TextColumn;
			},
			({
				name?: string | undefined;
				label?: string | undefined;
				unique?: boolean | undefined;
				deprecated?: boolean | undefined;
				collection?: string | undefined;
				default?: string | SQL<any> | undefined;
				multiline?: boolean | undefined;
				enum?: [string, ...string[]] | undefined;
			} & (
				| {
						primaryKey?: false | undefined;
						optional?: boolean | undefined;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
				  }
			)) & {
				references?: () => z.input<typeof textColumnSchema>;
			},
			z.core.$ZodTypeInternals<
				({
					unique: boolean;
					deprecated: boolean;
					name?: string | undefined;
					label?: string | undefined;
					collection?: string | undefined;
					default?: string | SerializedSQL | undefined;
					multiline?: boolean | undefined;
					enum?: [string, ...string[]] | undefined;
				} & (
					| {
							primaryKey: false;
							optional: boolean;
					  }
					| {
							primaryKey: true;
							optional?: false | undefined;
					  }
				)) & {
					references?: TextColumn;
				},
				({
					name?: string | undefined;
					label?: string | undefined;
					unique?: boolean | undefined;
					deprecated?: boolean | undefined;
					collection?: string | undefined;
					default?: string | SQL<any> | undefined;
					multiline?: boolean | undefined;
					enum?: [string, ...string[]] | undefined;
				} & (
					| {
							primaryKey?: false | undefined;
							optional?: boolean | undefined;
					  }
					| {
							primaryKey: true;
							optional?: false | undefined;
					  }
				)) & {
					references?: () => z.input<typeof textColumnSchema>;
				}
			>
		>;
	},
	z.core.$strip
>;
export declare const dateColumnSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'date'>;
		schema: z.ZodObject<
			{
				label: z.ZodOptional<z.ZodString>;
				optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				name: z.ZodOptional<z.ZodString>;
				collection: z.ZodOptional<z.ZodString>;
				default: z.ZodOptional<
					z.ZodUnion<
						readonly [
							z.ZodPipe<z.ZodCustom<SQL<any>, SQL<any>>, z.ZodTransform<SerializedSQL, SQL<any>>>,
							z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
						]
					>
				>;
			},
			z.core.$strip
		>;
	},
	z.core.$strip
>;
export declare const jsonColumnSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'json'>;
		schema: z.ZodObject<
			{
				label: z.ZodOptional<z.ZodString>;
				optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				name: z.ZodOptional<z.ZodString>;
				collection: z.ZodOptional<z.ZodString>;
				default: z.ZodOptional<z.ZodUnknown>;
			},
			z.core.$strip
		>;
	},
	z.core.$strip
>;
export declare const columnSchema: z.ZodDiscriminatedUnion<
	[
		z.ZodObject<
			{
				type: z.ZodLiteral<'boolean'>;
				schema: z.ZodObject<
					{
						label: z.ZodOptional<z.ZodString>;
						optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						name: z.ZodOptional<z.ZodString>;
						collection: z.ZodOptional<z.ZodString>;
						default: z.ZodOptional<
							z.ZodUnion<
								readonly [
									z.ZodBoolean,
									z.ZodPipe<
										z.ZodCustom<SQL<any>, SQL<any>>,
										z.ZodTransform<SerializedSQL, SQL<any>>
									>,
								]
							>
						>;
					},
					z.core.$strip
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'number'>;
				schema: z.ZodType<
					({
						unique: boolean;
						deprecated: boolean;
						name?: string | undefined;
						label?: string | undefined;
						collection?: string | undefined;
					} & (
						| {
								primaryKey: false;
								optional: boolean;
								default?: number | SerializedSQL | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
								default?: undefined;
						  }
					)) & {
						references?: NumberColumn;
					},
					({
						name?: string | undefined;
						label?: string | undefined;
						unique?: boolean | undefined;
						deprecated?: boolean | undefined;
						collection?: string | undefined;
					} & (
						| {
								primaryKey?: false | undefined;
								optional?: boolean | undefined;
								default?: number | SQL<any> | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
								default?: undefined;
						  }
					)) & {
						references?: () => z.input<typeof numberColumnSchema>;
					},
					z.core.$ZodTypeInternals<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
									default?: number | SerializedSQL | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: NumberColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
									default?: number | SQL<any> | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: () => z.input<typeof numberColumnSchema>;
						}
					>
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'text'>;
				schema: z.ZodType<
					({
						unique: boolean;
						deprecated: boolean;
						name?: string | undefined;
						label?: string | undefined;
						collection?: string | undefined;
						default?: string | SerializedSQL | undefined;
						multiline?: boolean | undefined;
						enum?: [string, ...string[]] | undefined;
					} & (
						| {
								primaryKey: false;
								optional: boolean;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
						  }
					)) & {
						references?: TextColumn;
					},
					({
						name?: string | undefined;
						label?: string | undefined;
						unique?: boolean | undefined;
						deprecated?: boolean | undefined;
						collection?: string | undefined;
						default?: string | SQL<any> | undefined;
						multiline?: boolean | undefined;
						enum?: [string, ...string[]] | undefined;
					} & (
						| {
								primaryKey?: false | undefined;
								optional?: boolean | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
						  }
					)) & {
						references?: () => z.input<typeof textColumnSchema>;
					},
					z.core.$ZodTypeInternals<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
							default?: string | SerializedSQL | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: TextColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
							default?: string | SQL<any> | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: () => z.input<typeof textColumnSchema>;
						}
					>
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'date'>;
				schema: z.ZodObject<
					{
						label: z.ZodOptional<z.ZodString>;
						optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						name: z.ZodOptional<z.ZodString>;
						collection: z.ZodOptional<z.ZodString>;
						default: z.ZodOptional<
							z.ZodUnion<
								readonly [
									z.ZodPipe<
										z.ZodCustom<SQL<any>, SQL<any>>,
										z.ZodTransform<SerializedSQL, SQL<any>>
									>,
									z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
								]
							>
						>;
					},
					z.core.$strip
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'json'>;
				schema: z.ZodObject<
					{
						label: z.ZodOptional<z.ZodString>;
						optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
						name: z.ZodOptional<z.ZodString>;
						collection: z.ZodOptional<z.ZodString>;
						default: z.ZodOptional<z.ZodUnknown>;
					},
					z.core.$strip
				>;
			},
			z.core.$strip
		>,
	],
	'type'
>;
export declare const referenceableColumnSchema: z.ZodUnion<
	readonly [
		z.ZodObject<
			{
				type: z.ZodLiteral<'text'>;
				schema: z.ZodType<
					({
						unique: boolean;
						deprecated: boolean;
						name?: string | undefined;
						label?: string | undefined;
						collection?: string | undefined;
						default?: string | SerializedSQL | undefined;
						multiline?: boolean | undefined;
						enum?: [string, ...string[]] | undefined;
					} & (
						| {
								primaryKey: false;
								optional: boolean;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
						  }
					)) & {
						references?: TextColumn;
					},
					({
						name?: string | undefined;
						label?: string | undefined;
						unique?: boolean | undefined;
						deprecated?: boolean | undefined;
						collection?: string | undefined;
						default?: string | SQL<any> | undefined;
						multiline?: boolean | undefined;
						enum?: [string, ...string[]] | undefined;
					} & (
						| {
								primaryKey?: false | undefined;
								optional?: boolean | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
						  }
					)) & {
						references?: () => z.input<typeof textColumnSchema>;
					},
					z.core.$ZodTypeInternals<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
							default?: string | SerializedSQL | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: TextColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
							default?: string | SQL<any> | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: () => z.input<typeof textColumnSchema>;
						}
					>
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'number'>;
				schema: z.ZodType<
					({
						unique: boolean;
						deprecated: boolean;
						name?: string | undefined;
						label?: string | undefined;
						collection?: string | undefined;
					} & (
						| {
								primaryKey: false;
								optional: boolean;
								default?: number | SerializedSQL | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
								default?: undefined;
						  }
					)) & {
						references?: NumberColumn;
					},
					({
						name?: string | undefined;
						label?: string | undefined;
						unique?: boolean | undefined;
						deprecated?: boolean | undefined;
						collection?: string | undefined;
					} & (
						| {
								primaryKey?: false | undefined;
								optional?: boolean | undefined;
								default?: number | SQL<any> | undefined;
						  }
						| {
								primaryKey: true;
								optional?: false | undefined;
								default?: undefined;
						  }
					)) & {
						references?: () => z.input<typeof numberColumnSchema>;
					},
					z.core.$ZodTypeInternals<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
									default?: number | SerializedSQL | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: NumberColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
									default?: number | SQL<any> | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: () => z.input<typeof numberColumnSchema>;
						}
					>
				>;
			},
			z.core.$strip
		>,
	]
>;
export declare const columnsSchema: z.ZodRecord<
	z.ZodString,
	z.ZodDiscriminatedUnion<
		[
			z.ZodObject<
				{
					type: z.ZodLiteral<'boolean'>;
					schema: z.ZodObject<
						{
							label: z.ZodOptional<z.ZodString>;
							optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							name: z.ZodOptional<z.ZodString>;
							collection: z.ZodOptional<z.ZodString>;
							default: z.ZodOptional<
								z.ZodUnion<
									readonly [
										z.ZodBoolean,
										z.ZodPipe<
											z.ZodCustom<SQL<any>, SQL<any>>,
											z.ZodTransform<SerializedSQL, SQL<any>>
										>,
									]
								>
							>;
						},
						z.core.$strip
					>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					type: z.ZodLiteral<'number'>;
					schema: z.ZodType<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
									default?: number | SerializedSQL | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: NumberColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
									default?: number | SQL<any> | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
									default?: undefined;
							  }
						)) & {
							references?: () => z.input<typeof numberColumnSchema>;
						},
						z.core.$ZodTypeInternals<
							({
								unique: boolean;
								deprecated: boolean;
								name?: string | undefined;
								label?: string | undefined;
								collection?: string | undefined;
							} & (
								| {
										primaryKey: false;
										optional: boolean;
										default?: number | SerializedSQL | undefined;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
										default?: undefined;
								  }
							)) & {
								references?: NumberColumn;
							},
							({
								name?: string | undefined;
								label?: string | undefined;
								unique?: boolean | undefined;
								deprecated?: boolean | undefined;
								collection?: string | undefined;
							} & (
								| {
										primaryKey?: false | undefined;
										optional?: boolean | undefined;
										default?: number | SQL<any> | undefined;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
										default?: undefined;
								  }
							)) & {
								references?: () => z.input<typeof numberColumnSchema>;
							}
						>
					>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					type: z.ZodLiteral<'text'>;
					schema: z.ZodType<
						({
							unique: boolean;
							deprecated: boolean;
							name?: string | undefined;
							label?: string | undefined;
							collection?: string | undefined;
							default?: string | SerializedSQL | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey: false;
									optional: boolean;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: TextColumn;
						},
						({
							name?: string | undefined;
							label?: string | undefined;
							unique?: boolean | undefined;
							deprecated?: boolean | undefined;
							collection?: string | undefined;
							default?: string | SQL<any> | undefined;
							multiline?: boolean | undefined;
							enum?: [string, ...string[]] | undefined;
						} & (
							| {
									primaryKey?: false | undefined;
									optional?: boolean | undefined;
							  }
							| {
									primaryKey: true;
									optional?: false | undefined;
							  }
						)) & {
							references?: () => z.input<typeof textColumnSchema>;
						},
						z.core.$ZodTypeInternals<
							({
								unique: boolean;
								deprecated: boolean;
								name?: string | undefined;
								label?: string | undefined;
								collection?: string | undefined;
								default?: string | SerializedSQL | undefined;
								multiline?: boolean | undefined;
								enum?: [string, ...string[]] | undefined;
							} & (
								| {
										primaryKey: false;
										optional: boolean;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
								  }
							)) & {
								references?: TextColumn;
							},
							({
								name?: string | undefined;
								label?: string | undefined;
								unique?: boolean | undefined;
								deprecated?: boolean | undefined;
								collection?: string | undefined;
								default?: string | SQL<any> | undefined;
								multiline?: boolean | undefined;
								enum?: [string, ...string[]] | undefined;
							} & (
								| {
										primaryKey?: false | undefined;
										optional?: boolean | undefined;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
								  }
							)) & {
								references?: () => z.input<typeof textColumnSchema>;
							}
						>
					>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					type: z.ZodLiteral<'date'>;
					schema: z.ZodObject<
						{
							label: z.ZodOptional<z.ZodString>;
							optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							name: z.ZodOptional<z.ZodString>;
							collection: z.ZodOptional<z.ZodString>;
							default: z.ZodOptional<
								z.ZodUnion<
									readonly [
										z.ZodPipe<
											z.ZodCustom<SQL<any>, SQL<any>>,
											z.ZodTransform<SerializedSQL, SQL<any>>
										>,
										z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
									]
								>
							>;
						},
						z.core.$strip
					>;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					type: z.ZodLiteral<'json'>;
					schema: z.ZodObject<
						{
							label: z.ZodOptional<z.ZodString>;
							optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							name: z.ZodOptional<z.ZodString>;
							collection: z.ZodOptional<z.ZodString>;
							default: z.ZodOptional<z.ZodUnknown>;
						},
						z.core.$strip
					>;
				},
				z.core.$strip
			>,
		],
		'type'
	>
>;
type ForeignKeysInput = {
	columns: MaybeArray<string>;
	references: () => MaybeArray<Omit<z.input<typeof referenceableColumnSchema>, 'references'>>;
};
type ForeignKeysOutput = Omit<ForeignKeysInput, 'references'> & {
	references: MaybeArray<Omit<z.output<typeof referenceableColumnSchema>, 'references'>>;
};
export declare const resolvedIndexSchema: z.ZodObject<
	{
		on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
		unique: z.ZodOptional<z.ZodBoolean>;
	},
	z.core.$strip
>;
export declare const indexSchema: z.ZodObject<
	{
		on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
		unique: z.ZodOptional<z.ZodBoolean>;
		name: z.ZodOptional<z.ZodString>;
	},
	z.core.$strip
>;
export declare const tableSchema: z.ZodObject<
	{
		columns: z.ZodRecord<
			z.ZodString,
			z.ZodDiscriminatedUnion<
				[
					z.ZodObject<
						{
							type: z.ZodLiteral<'boolean'>;
							schema: z.ZodObject<
								{
									label: z.ZodOptional<z.ZodString>;
									optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									name: z.ZodOptional<z.ZodString>;
									collection: z.ZodOptional<z.ZodString>;
									default: z.ZodOptional<
										z.ZodUnion<
											readonly [
												z.ZodBoolean,
												z.ZodPipe<
													z.ZodCustom<SQL<any>, SQL<any>>,
													z.ZodTransform<SerializedSQL, SQL<any>>
												>,
											]
										>
									>;
								},
								z.core.$strip
							>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodLiteral<'number'>;
							schema: z.ZodType<
								({
									unique: boolean;
									deprecated: boolean;
									name?: string | undefined;
									label?: string | undefined;
									collection?: string | undefined;
								} & (
									| {
											primaryKey: false;
											optional: boolean;
											default?: number | SerializedSQL | undefined;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
											default?: undefined;
									  }
								)) & {
									references?: NumberColumn;
								},
								({
									name?: string | undefined;
									label?: string | undefined;
									unique?: boolean | undefined;
									deprecated?: boolean | undefined;
									collection?: string | undefined;
								} & (
									| {
											primaryKey?: false | undefined;
											optional?: boolean | undefined;
											default?: number | SQL<any> | undefined;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
											default?: undefined;
									  }
								)) & {
									references?: () => z.input<typeof numberColumnSchema>;
								},
								z.core.$ZodTypeInternals<
									({
										unique: boolean;
										deprecated: boolean;
										name?: string | undefined;
										label?: string | undefined;
										collection?: string | undefined;
									} & (
										| {
												primaryKey: false;
												optional: boolean;
												default?: number | SerializedSQL | undefined;
										  }
										| {
												primaryKey: true;
												optional?: false | undefined;
												default?: undefined;
										  }
									)) & {
										references?: NumberColumn;
									},
									({
										name?: string | undefined;
										label?: string | undefined;
										unique?: boolean | undefined;
										deprecated?: boolean | undefined;
										collection?: string | undefined;
									} & (
										| {
												primaryKey?: false | undefined;
												optional?: boolean | undefined;
												default?: number | SQL<any> | undefined;
										  }
										| {
												primaryKey: true;
												optional?: false | undefined;
												default?: undefined;
										  }
									)) & {
										references?: () => z.input<typeof numberColumnSchema>;
									}
								>
							>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodLiteral<'text'>;
							schema: z.ZodType<
								({
									unique: boolean;
									deprecated: boolean;
									name?: string | undefined;
									label?: string | undefined;
									collection?: string | undefined;
									default?: string | SerializedSQL | undefined;
									multiline?: boolean | undefined;
									enum?: [string, ...string[]] | undefined;
								} & (
									| {
											primaryKey: false;
											optional: boolean;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
									  }
								)) & {
									references?: TextColumn;
								},
								({
									name?: string | undefined;
									label?: string | undefined;
									unique?: boolean | undefined;
									deprecated?: boolean | undefined;
									collection?: string | undefined;
									default?: string | SQL<any> | undefined;
									multiline?: boolean | undefined;
									enum?: [string, ...string[]] | undefined;
								} & (
									| {
											primaryKey?: false | undefined;
											optional?: boolean | undefined;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
									  }
								)) & {
									references?: () => z.input<typeof textColumnSchema>;
								},
								z.core.$ZodTypeInternals<
									({
										unique: boolean;
										deprecated: boolean;
										name?: string | undefined;
										label?: string | undefined;
										collection?: string | undefined;
										default?: string | SerializedSQL | undefined;
										multiline?: boolean | undefined;
										enum?: [string, ...string[]] | undefined;
									} & (
										| {
												primaryKey: false;
												optional: boolean;
										  }
										| {
												primaryKey: true;
												optional?: false | undefined;
										  }
									)) & {
										references?: TextColumn;
									},
									({
										name?: string | undefined;
										label?: string | undefined;
										unique?: boolean | undefined;
										deprecated?: boolean | undefined;
										collection?: string | undefined;
										default?: string | SQL<any> | undefined;
										multiline?: boolean | undefined;
										enum?: [string, ...string[]] | undefined;
									} & (
										| {
												primaryKey?: false | undefined;
												optional?: boolean | undefined;
										  }
										| {
												primaryKey: true;
												optional?: false | undefined;
										  }
									)) & {
										references?: () => z.input<typeof textColumnSchema>;
									}
								>
							>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodLiteral<'date'>;
							schema: z.ZodObject<
								{
									label: z.ZodOptional<z.ZodString>;
									optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									name: z.ZodOptional<z.ZodString>;
									collection: z.ZodOptional<z.ZodString>;
									default: z.ZodOptional<
										z.ZodUnion<
											readonly [
												z.ZodPipe<
													z.ZodCustom<SQL<any>, SQL<any>>,
													z.ZodTransform<SerializedSQL, SQL<any>>
												>,
												z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
											]
										>
									>;
								},
								z.core.$strip
							>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodLiteral<'json'>;
							schema: z.ZodObject<
								{
									label: z.ZodOptional<z.ZodString>;
									optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
									name: z.ZodOptional<z.ZodString>;
									collection: z.ZodOptional<z.ZodString>;
									default: z.ZodOptional<z.ZodUnknown>;
								},
								z.core.$strip
							>;
						},
						z.core.$strip
					>,
				],
				'type'
			>
		>;
		indexes: z.ZodOptional<
			z.ZodUnion<
				[
					z.ZodArray<
						z.ZodObject<
							{
								on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
								unique: z.ZodOptional<z.ZodBoolean>;
								name: z.ZodOptional<z.ZodString>;
							},
							z.core.$strip
						>
					>,
					z.ZodRecord<
						z.ZodString,
						z.ZodObject<
							{
								on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
								unique: z.ZodOptional<z.ZodBoolean>;
							},
							z.core.$strip
						>
					>,
				]
			>
		>;
		foreignKeys: z.ZodOptional<
			z.ZodArray<
				z.ZodType<
					ForeignKeysOutput,
					ForeignKeysInput,
					z.core.$ZodTypeInternals<ForeignKeysOutput, ForeignKeysInput>
				>
			>
		>;
		deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
	},
	z.core.$strip
>;
export declare const tablesSchema: z.ZodPipe<
	z.ZodTransform<unknown, unknown>,
	z.ZodRecord<
		z.ZodString,
		z.ZodObject<
			{
				columns: z.ZodRecord<
					z.ZodString,
					z.ZodDiscriminatedUnion<
						[
							z.ZodObject<
								{
									type: z.ZodLiteral<'boolean'>;
									schema: z.ZodObject<
										{
											label: z.ZodOptional<z.ZodString>;
											optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											name: z.ZodOptional<z.ZodString>;
											collection: z.ZodOptional<z.ZodString>;
											default: z.ZodOptional<
												z.ZodUnion<
													readonly [
														z.ZodBoolean,
														z.ZodPipe<
															z.ZodCustom<SQL<any>, SQL<any>>,
															z.ZodTransform<SerializedSQL, SQL<any>>
														>,
													]
												>
											>;
										},
										z.core.$strip
									>;
								},
								z.core.$strip
							>,
							z.ZodObject<
								{
									type: z.ZodLiteral<'number'>;
									schema: z.ZodType<
										({
											unique: boolean;
											deprecated: boolean;
											name?: string | undefined;
											label?: string | undefined;
											collection?: string | undefined;
										} & (
											| {
													primaryKey: false;
													optional: boolean;
													default?: number | SerializedSQL | undefined;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
													default?: undefined;
											  }
										)) & {
											references?: NumberColumn;
										},
										({
											name?: string | undefined;
											label?: string | undefined;
											unique?: boolean | undefined;
											deprecated?: boolean | undefined;
											collection?: string | undefined;
										} & (
											| {
													primaryKey?: false | undefined;
													optional?: boolean | undefined;
													default?: number | SQL<any> | undefined;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
													default?: undefined;
											  }
										)) & {
											references?: () => z.input<typeof numberColumnSchema>;
										},
										z.core.$ZodTypeInternals<
											({
												unique: boolean;
												deprecated: boolean;
												name?: string | undefined;
												label?: string | undefined;
												collection?: string | undefined;
											} & (
												| {
														primaryKey: false;
														optional: boolean;
														default?: number | SerializedSQL | undefined;
												  }
												| {
														primaryKey: true;
														optional?: false | undefined;
														default?: undefined;
												  }
											)) & {
												references?: NumberColumn;
											},
											({
												name?: string | undefined;
												label?: string | undefined;
												unique?: boolean | undefined;
												deprecated?: boolean | undefined;
												collection?: string | undefined;
											} & (
												| {
														primaryKey?: false | undefined;
														optional?: boolean | undefined;
														default?: number | SQL<any> | undefined;
												  }
												| {
														primaryKey: true;
														optional?: false | undefined;
														default?: undefined;
												  }
											)) & {
												references?: () => z.input<typeof numberColumnSchema>;
											}
										>
									>;
								},
								z.core.$strip
							>,
							z.ZodObject<
								{
									type: z.ZodLiteral<'text'>;
									schema: z.ZodType<
										({
											unique: boolean;
											deprecated: boolean;
											name?: string | undefined;
											label?: string | undefined;
											collection?: string | undefined;
											default?: string | SerializedSQL | undefined;
											multiline?: boolean | undefined;
											enum?: [string, ...string[]] | undefined;
										} & (
											| {
													primaryKey: false;
													optional: boolean;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
											  }
										)) & {
											references?: TextColumn;
										},
										({
											name?: string | undefined;
											label?: string | undefined;
											unique?: boolean | undefined;
											deprecated?: boolean | undefined;
											collection?: string | undefined;
											default?: string | SQL<any> | undefined;
											multiline?: boolean | undefined;
											enum?: [string, ...string[]] | undefined;
										} & (
											| {
													primaryKey?: false | undefined;
													optional?: boolean | undefined;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
											  }
										)) & {
											references?: () => z.input<typeof textColumnSchema>;
										},
										z.core.$ZodTypeInternals<
											({
												unique: boolean;
												deprecated: boolean;
												name?: string | undefined;
												label?: string | undefined;
												collection?: string | undefined;
												default?: string | SerializedSQL | undefined;
												multiline?: boolean | undefined;
												enum?: [string, ...string[]] | undefined;
											} & (
												| {
														primaryKey: false;
														optional: boolean;
												  }
												| {
														primaryKey: true;
														optional?: false | undefined;
												  }
											)) & {
												references?: TextColumn;
											},
											({
												name?: string | undefined;
												label?: string | undefined;
												unique?: boolean | undefined;
												deprecated?: boolean | undefined;
												collection?: string | undefined;
												default?: string | SQL<any> | undefined;
												multiline?: boolean | undefined;
												enum?: [string, ...string[]] | undefined;
											} & (
												| {
														primaryKey?: false | undefined;
														optional?: boolean | undefined;
												  }
												| {
														primaryKey: true;
														optional?: false | undefined;
												  }
											)) & {
												references?: () => z.input<typeof textColumnSchema>;
											}
										>
									>;
								},
								z.core.$strip
							>,
							z.ZodObject<
								{
									type: z.ZodLiteral<'date'>;
									schema: z.ZodObject<
										{
											label: z.ZodOptional<z.ZodString>;
											optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											name: z.ZodOptional<z.ZodString>;
											collection: z.ZodOptional<z.ZodString>;
											default: z.ZodOptional<
												z.ZodUnion<
													readonly [
														z.ZodPipe<
															z.ZodCustom<SQL<any>, SQL<any>>,
															z.ZodTransform<SerializedSQL, SQL<any>>
														>,
														z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
													]
												>
											>;
										},
										z.core.$strip
									>;
								},
								z.core.$strip
							>,
							z.ZodObject<
								{
									type: z.ZodLiteral<'json'>;
									schema: z.ZodObject<
										{
											label: z.ZodOptional<z.ZodString>;
											optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
											name: z.ZodOptional<z.ZodString>;
											collection: z.ZodOptional<z.ZodString>;
											default: z.ZodOptional<z.ZodUnknown>;
										},
										z.core.$strip
									>;
								},
								z.core.$strip
							>,
						],
						'type'
					>
				>;
				indexes: z.ZodOptional<
					z.ZodUnion<
						[
							z.ZodArray<
								z.ZodObject<
									{
										on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
										unique: z.ZodOptional<z.ZodBoolean>;
										name: z.ZodOptional<z.ZodString>;
									},
									z.core.$strip
								>
							>,
							z.ZodRecord<
								z.ZodString,
								z.ZodObject<
									{
										on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
										unique: z.ZodOptional<z.ZodBoolean>;
									},
									z.core.$strip
								>
							>,
						]
					>
				>;
				foreignKeys: z.ZodOptional<
					z.ZodArray<
						z.ZodType<
							ForeignKeysOutput,
							ForeignKeysInput,
							z.core.$ZodTypeInternals<ForeignKeysOutput, ForeignKeysInput>
						>
					>
				>;
				deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
			},
			z.core.$strip
		>
	>
>;
export declare const dbConfigSchema: z.ZodPipe<
	z.ZodObject<
		{
			tables: z.ZodOptional<
				z.ZodPipe<
					z.ZodTransform<unknown, unknown>,
					z.ZodRecord<
						z.ZodString,
						z.ZodObject<
							{
								columns: z.ZodRecord<
									z.ZodString,
									z.ZodDiscriminatedUnion<
										[
											z.ZodObject<
												{
													type: z.ZodLiteral<'boolean'>;
													schema: z.ZodObject<
														{
															label: z.ZodOptional<z.ZodString>;
															optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															name: z.ZodOptional<z.ZodString>;
															collection: z.ZodOptional<z.ZodString>;
															default: z.ZodOptional<
																z.ZodUnion<
																	readonly [
																		z.ZodBoolean,
																		z.ZodPipe<
																			z.ZodCustom<SQL<any>, SQL<any>>,
																			z.ZodTransform<SerializedSQL, SQL<any>>
																		>,
																	]
																>
															>;
														},
														z.core.$strip
													>;
												},
												z.core.$strip
											>,
											z.ZodObject<
												{
													type: z.ZodLiteral<'number'>;
													schema: z.ZodType<
														({
															unique: boolean;
															deprecated: boolean;
															name?: string | undefined;
															label?: string | undefined;
															collection?: string | undefined;
														} & (
															| {
																	primaryKey: false;
																	optional: boolean;
																	default?: number | SerializedSQL | undefined;
															  }
															| {
																	primaryKey: true;
																	optional?: false | undefined;
																	default?: undefined;
															  }
														)) & {
															references?: NumberColumn;
														},
														({
															name?: string | undefined;
															label?: string | undefined;
															unique?: boolean | undefined;
															deprecated?: boolean | undefined;
															collection?: string | undefined;
														} & (
															| {
																	primaryKey?: false | undefined;
																	optional?: boolean | undefined;
																	default?: number | SQL<any> | undefined;
															  }
															| {
																	primaryKey: true;
																	optional?: false | undefined;
																	default?: undefined;
															  }
														)) & {
															references?: () => z.input<typeof numberColumnSchema>;
														},
														z.core.$ZodTypeInternals<
															({
																unique: boolean;
																deprecated: boolean;
																name?: string | undefined;
																label?: string | undefined;
																collection?: string | undefined;
															} & (
																| {
																		primaryKey: false;
																		optional: boolean;
																		default?: number | SerializedSQL | undefined;
																  }
																| {
																		primaryKey: true;
																		optional?: false | undefined;
																		default?: undefined;
																  }
															)) & {
																references?: NumberColumn;
															},
															({
																name?: string | undefined;
																label?: string | undefined;
																unique?: boolean | undefined;
																deprecated?: boolean | undefined;
																collection?: string | undefined;
															} & (
																| {
																		primaryKey?: false | undefined;
																		optional?: boolean | undefined;
																		default?: number | SQL<any> | undefined;
																  }
																| {
																		primaryKey: true;
																		optional?: false | undefined;
																		default?: undefined;
																  }
															)) & {
																references?: () => z.input<typeof numberColumnSchema>;
															}
														>
													>;
												},
												z.core.$strip
											>,
											z.ZodObject<
												{
													type: z.ZodLiteral<'text'>;
													schema: z.ZodType<
														({
															unique: boolean;
															deprecated: boolean;
															name?: string | undefined;
															label?: string | undefined;
															collection?: string | undefined;
															default?: string | SerializedSQL | undefined;
															multiline?: boolean | undefined;
															enum?: [string, ...string[]] | undefined;
														} & (
															| {
																	primaryKey: false;
																	optional: boolean;
															  }
															| {
																	primaryKey: true;
																	optional?: false | undefined;
															  }
														)) & {
															references?: TextColumn;
														},
														({
															name?: string | undefined;
															label?: string | undefined;
															unique?: boolean | undefined;
															deprecated?: boolean | undefined;
															collection?: string | undefined;
															default?: string | SQL<any> | undefined;
															multiline?: boolean | undefined;
															enum?: [string, ...string[]] | undefined;
														} & (
															| {
																	primaryKey?: false | undefined;
																	optional?: boolean | undefined;
															  }
															| {
																	primaryKey: true;
																	optional?: false | undefined;
															  }
														)) & {
															references?: () => z.input<typeof textColumnSchema>;
														},
														z.core.$ZodTypeInternals<
															({
																unique: boolean;
																deprecated: boolean;
																name?: string | undefined;
																label?: string | undefined;
																collection?: string | undefined;
																default?: string | SerializedSQL | undefined;
																multiline?: boolean | undefined;
																enum?: [string, ...string[]] | undefined;
															} & (
																| {
																		primaryKey: false;
																		optional: boolean;
																  }
																| {
																		primaryKey: true;
																		optional?: false | undefined;
																  }
															)) & {
																references?: TextColumn;
															},
															({
																name?: string | undefined;
																label?: string | undefined;
																unique?: boolean | undefined;
																deprecated?: boolean | undefined;
																collection?: string | undefined;
																default?: string | SQL<any> | undefined;
																multiline?: boolean | undefined;
																enum?: [string, ...string[]] | undefined;
															} & (
																| {
																		primaryKey?: false | undefined;
																		optional?: boolean | undefined;
																  }
																| {
																		primaryKey: true;
																		optional?: false | undefined;
																  }
															)) & {
																references?: () => z.input<typeof textColumnSchema>;
															}
														>
													>;
												},
												z.core.$strip
											>,
											z.ZodObject<
												{
													type: z.ZodLiteral<'date'>;
													schema: z.ZodObject<
														{
															label: z.ZodOptional<z.ZodString>;
															optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															name: z.ZodOptional<z.ZodString>;
															collection: z.ZodOptional<z.ZodString>;
															default: z.ZodOptional<
																z.ZodUnion<
																	readonly [
																		z.ZodPipe<
																			z.ZodCustom<SQL<any>, SQL<any>>,
																			z.ZodTransform<SerializedSQL, SQL<any>>
																		>,
																		z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>,
																	]
																>
															>;
														},
														z.core.$strip
													>;
												},
												z.core.$strip
											>,
											z.ZodObject<
												{
													type: z.ZodLiteral<'json'>;
													schema: z.ZodObject<
														{
															label: z.ZodOptional<z.ZodString>;
															optional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															unique: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
															name: z.ZodOptional<z.ZodString>;
															collection: z.ZodOptional<z.ZodString>;
															default: z.ZodOptional<z.ZodUnknown>;
														},
														z.core.$strip
													>;
												},
												z.core.$strip
											>,
										],
										'type'
									>
								>;
								indexes: z.ZodOptional<
									z.ZodUnion<
										[
											z.ZodArray<
												z.ZodObject<
													{
														on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
														unique: z.ZodOptional<z.ZodBoolean>;
														name: z.ZodOptional<z.ZodString>;
													},
													z.core.$strip
												>
											>,
											z.ZodRecord<
												z.ZodString,
												z.ZodObject<
													{
														on: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
														unique: z.ZodOptional<z.ZodBoolean>;
													},
													z.core.$strip
												>
											>,
										]
									>
								>;
								foreignKeys: z.ZodOptional<
									z.ZodArray<
										z.ZodType<
											ForeignKeysOutput,
											ForeignKeysInput,
											z.core.$ZodTypeInternals<ForeignKeysOutput, ForeignKeysInput>
										>
									>
								>;
								deprecated: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
							},
							z.core.$strip
						>
					>
				>
			>;
		},
		z.core.$strip
	>,
	z.ZodTransform<
		{
			tables: Record<
				string,
				{
					indexes: Record<
						string,
						{
							on: string | string[];
							unique?: boolean | undefined;
						}
					>;
					columns: Record<
						string,
						| {
								type: 'boolean';
								schema: {
									optional: boolean;
									unique: boolean;
									deprecated: boolean;
									label?: string | undefined;
									name?: string | undefined;
									collection?: string | undefined;
									default?: boolean | SerializedSQL | undefined;
								};
						  }
						| {
								type: 'number';
								schema: ({
									unique: boolean;
									deprecated: boolean;
									name?: string | undefined;
									label?: string | undefined;
									collection?: string | undefined;
								} & (
									| {
											primaryKey: false;
											optional: boolean;
											default?: number | SerializedSQL | undefined;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
											default?: undefined;
									  }
								)) & {
									references?: NumberColumn;
								};
						  }
						| {
								type: 'text';
								schema: ({
									unique: boolean;
									deprecated: boolean;
									name?: string | undefined;
									label?: string | undefined;
									collection?: string | undefined;
									default?: string | SerializedSQL | undefined;
									multiline?: boolean | undefined;
									enum?: [string, ...string[]] | undefined;
								} & (
									| {
											primaryKey: false;
											optional: boolean;
									  }
									| {
											primaryKey: true;
											optional?: false | undefined;
									  }
								)) & {
									references?: TextColumn;
								};
						  }
						| {
								type: 'date';
								schema: {
									optional: boolean;
									unique: boolean;
									deprecated: boolean;
									label?: string | undefined;
									name?: string | undefined;
									collection?: string | undefined;
									default?: string | SerializedSQL | undefined;
								};
						  }
						| {
								type: 'json';
								schema: {
									optional: boolean;
									unique: boolean;
									deprecated: boolean;
									label?: string | undefined;
									name?: string | undefined;
									collection?: string | undefined;
									default?: unknown;
								};
						  }
					>;
					deprecated: boolean;
					foreignKeys?: ForeignKeysOutput[] | undefined;
				}
			>;
		},
		{
			tables?:
				| Record<
						string,
						{
							columns: Record<
								string,
								| {
										type: 'boolean';
										schema: {
											optional: boolean;
											unique: boolean;
											deprecated: boolean;
											label?: string | undefined;
											name?: string | undefined;
											collection?: string | undefined;
											default?: boolean | SerializedSQL | undefined;
										};
								  }
								| {
										type: 'number';
										schema: ({
											unique: boolean;
											deprecated: boolean;
											name?: string | undefined;
											label?: string | undefined;
											collection?: string | undefined;
										} & (
											| {
													primaryKey: false;
													optional: boolean;
													default?: number | SerializedSQL | undefined;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
													default?: undefined;
											  }
										)) & {
											references?: NumberColumn;
										};
								  }
								| {
										type: 'text';
										schema: ({
											unique: boolean;
											deprecated: boolean;
											name?: string | undefined;
											label?: string | undefined;
											collection?: string | undefined;
											default?: string | SerializedSQL | undefined;
											multiline?: boolean | undefined;
											enum?: [string, ...string[]] | undefined;
										} & (
											| {
													primaryKey: false;
													optional: boolean;
											  }
											| {
													primaryKey: true;
													optional?: false | undefined;
											  }
										)) & {
											references?: TextColumn;
										};
								  }
								| {
										type: 'date';
										schema: {
											optional: boolean;
											unique: boolean;
											deprecated: boolean;
											label?: string | undefined;
											name?: string | undefined;
											collection?: string | undefined;
											default?: string | SerializedSQL | undefined;
										};
								  }
								| {
										type: 'json';
										schema: {
											optional: boolean;
											unique: boolean;
											deprecated: boolean;
											label?: string | undefined;
											name?: string | undefined;
											collection?: string | undefined;
											default?: unknown;
										};
								  }
							>;
							deprecated: boolean;
							indexes?:
								| Record<
										string,
										{
											on: string | string[];
											unique?: boolean | undefined;
										}
								  >
								| {
										on: string | string[];
										unique?: boolean | undefined;
										name?: string | undefined;
								  }[]
								| undefined;
							foreignKeys?: ForeignKeysOutput[] | undefined;
						}
				  >
				| undefined;
		}
	>
>;
export {};
