import { z } from 'zod';

/**
 * Zod schema for validating the session login request body.
 */
export const sessionLoginSchema = z.object({
  body: z.object({
    idToken: z.string({
        required_error: 'Firebase ID token is required.',
        invalid_type_error: 'Firebase ID token must be a string.',
      })
      .min(1, { message: 'Firebase ID token cannot be empty.' }),
  }),
});

export const signUpSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .min(1, { message: 'Email cannot be empty.' })
    .email({ message: 'Invalid email format.' }),
  }),
});