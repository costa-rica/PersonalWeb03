import { z } from 'zod';
import { logValidationFailure } from './securityLogger';

// SECURITY: Email validation with strict requirements
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(320, 'Email is too long') // RFC 5321 max length
  .email('Please enter a valid email address')
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Invalid email format'
  )
  .transform((email) => email.toLowerCase().trim());

// SECURITY: Password validation with strong requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^[\x20-\x7E]*$/,
    'Password contains invalid characters (use printable ASCII only)'
  );

// SECURITY: Title validation for blog posts
const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title is too long')
  .regex(
    /^[a-zA-Z0-9\s\-_.,!?()'"]+$/,
    'Title contains invalid characters'
  )
  .transform((title) => title.trim());

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Don't validate strength on login
});

// Register schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema, // Full validation for new passwords
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema, // Full validation for new passwords
});

// Blog post upload schema (for title validation)
export const blogPostTitleSchema = z.object({
  title: titleSchema,
});

// SECURITY: Helper function for safe validation
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  if (result.error?.issues) {
    result.error.issues.forEach((issue) => {
      const field = issue.path.join('.');
      errors[field] = issue.message;
    });
  }

  return { success: false, errors };
}

// Type exports for convenience
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type BlogPostTitleFormData = z.infer<typeof blogPostTitleSchema>;
