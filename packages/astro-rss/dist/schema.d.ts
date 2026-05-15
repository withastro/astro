import * as z from 'zod/v4';
export declare const rssSchema: z.ZodObject<
	{
		title: z.ZodOptional<z.ZodString>;
		description: z.ZodOptional<z.ZodString>;
		pubDate: z.ZodOptional<
			z.ZodPipe<
				z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodDate]>,
				z.ZodTransform<Date, string | number | Date>
			>
		>;
		customData: z.ZodOptional<z.ZodString>;
		categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
		author: z.ZodOptional<z.ZodString>;
		commentsUrl: z.ZodOptional<z.ZodString>;
		source: z.ZodOptional<
			z.ZodObject<
				{
					url: z.ZodString;
					title: z.ZodString;
				},
				z.core.$strip
			>
		>;
		enclosure: z.ZodOptional<
			z.ZodObject<
				{
					url: z.ZodString;
					length: z.ZodNumber;
					type: z.ZodString;
				},
				z.core.$strip
			>
		>;
		link: z.ZodOptional<z.ZodString>;
		content: z.ZodOptional<z.ZodString>;
	},
	z.core.$strip
>;
