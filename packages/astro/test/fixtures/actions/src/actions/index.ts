import { defineAction, ActionError, z } from 'astro:actions';

const passwordSchema = z
	.string()
	.min(8, 'Password should be at least 8 chars length')
	.max(128, 'Password length exceeded. Max 128 chars.');

export const server = {
	subscribe: defineAction({
		input: z.object({ channel: z.string() }),
		handler: async ({ channel }) => {
			return {
				channel,
				subscribeButtonState: 'smashed',
			};
		},
	}),
	subscribeFromServer: defineAction({
		input: z.object({ channel: z.string() }),
		handler: async ({ channel }, { url }) => {
			return {
				// Returned to ensure path rewrites are respected
				url: url.pathname,
				channel,
				subscribeButtonState: 'smashed',
			};
		},
	}),
	comment: defineAction({
		accept: 'form',
		input: z.object({ channel: z.string(), comment: z.string() }),
		handler: async ({ channel, comment }) => {
			return {
				channel,
				comment,
			};
		},
	}),
	commentPlainFormData: defineAction({
		accept: 'form',
		handler: async (formData) => {
			return {
				success: true,
				isFormData: formData instanceof FormData,
			};
		},
	}),
	getUser: defineAction({
		accept: 'form',
		handler: async (_, { locals }) => {
			return locals.user;
		},
	}),
	validatePassword: defineAction({
		accept: 'form',
		input: z
			.object({ password: z.string(), confirmPassword: z.string() })
			.refine((data) => data.password === data.confirmPassword, {
				message: 'Passwords do not match',
			}),
		handler: async ({ password }) => {
			return password;
		},
	}),
	validatePasswordComplex: defineAction({
		accept: 'form',
		input: z
			.object({
				currentPassword: passwordSchema,
				newPassword: passwordSchema,
				confirmNewPassword: passwordSchema,
			})
			.required()
			.refine(
				({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword,
				'The new password confirmation does not match',
			)
			.refine(
				({ currentPassword, newPassword }) => currentPassword !== newPassword,
				'The old password and the new password must not match',
			)
			.transform((input) => ({
				currentPassword: input.currentPassword,
				newPassword: input.newPassword,
			}))
			.pipe(
				z.object({
					currentPassword: passwordSchema,
					newPassword: passwordSchema,
				}),
			),
		handler: async (data) => {
			return data;
		},
	}),
	transformFormInput: defineAction({
		accept: 'form',
		input: z.instanceof(FormData).transform((formData) => Object.fromEntries(formData.entries())),
		handler: async (data) => {
			return data;
		},
	}),
	getUserOrThrow: defineAction({
		accept: 'form',
		handler: async (_, { locals }) => {
			if (locals.user?.name !== 'admin') {
				// Expected to throw
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'Not logged in',
				});
			}
			return locals.user;
		},
	}),
	fireAndForget: defineAction({
		handler: async () => {
			return;
		},
	}),
	zero: defineAction({
		handler: async () => {
			return 0;
		},
	}),
	false: defineAction({
		handler: async () => {
			return false;
		},
	}),
	complexValues: defineAction({
		handler: async () => {
			return {
				date: new Date(),
				set: new Set(),
				url: new URL('https://example.com'),
			};
		},
	}),
};
