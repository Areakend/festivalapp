import { z } from 'zod';

/**
 * Form validation schemas. Error messages are i18n KEYS — screens translate
 * them with t(), so validation stays language-agnostic.
 */

export const signInSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(8, 'auth.passwordTooShort'),
});

export const signUpSchema = signInSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
