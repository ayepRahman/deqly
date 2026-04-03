import { z } from 'zod'

const optionalUrl = z
  .string()
  .transform((val) => {
    if (!val) return val
    if (!/^https?:\/\//i.test(val)) return `https://${val}`
    return val
  })
  .pipe(
    z
      .string()
      .url('Please enter a valid URL (e.g. example.com)')
      .optional()
      .or(z.literal('')),
  )

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  occupation: z.string().optional(),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  mobileNumber: z.string().optional(),
  addMobileToCard: z.boolean(),
  websiteLink: optionalUrl,
  addWebsiteToCard: z.boolean(),
})

export type SignUpValues = z.infer<typeof signUpSchema>

export const profileSchema = z.object({
  name: z.string().optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  occupation: z.string().optional(),
  mobileNumber: z.string().optional(),
  websiteLink: optionalUrl,
})

export type ProfileValues = z.infer<typeof profileSchema>
