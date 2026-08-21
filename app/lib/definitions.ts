import * as z from 'zod'
import {isValidPhoneNumber} from  'libphonenumber-js'

export const LoginFormSchema = z.object({
  phoneNumber: z.string().refine((v) => isValidPhoneNumber(v, 'CI'), {
      error: 'Invalid phone number',
  }),
  password: z.string()
      .min(8, {error: 'Password must be at least 8 characters'})
      .max(100, {error: 'Password must be not exceed 100 characters'})
})


export const SignupFormSchema = z.object({
  firstname: z.string()
      .trim()
      .min(1,{error: 'First name must be at least 1 character'})
      .max(50, {error: 'First name must not exceed 50 characters'}),

  lastname: z.string()
      .trim()
      .min(1, {error: 'Last name must be at least 1 character'})
      .max(50, {error: 'Last name must not exceed 50 characters'}),

  phoneNumber: z.string().refine((v) => isValidPhoneNumber(v, 'CI'), {
      error: 'Invalid phone number',
  }),

  // Optionnel : un FormData renvoie toujours une string (jamais undefined) même si le
  // champ est laissé vide, donc on convertit "" en undefined AVANT d'appliquer la regex
  // — sinon .optional() seul ne suffit pas, une chaîne vide resterait rejetée par le
  // pattern (qui exige au moins un caractère avant le @).
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string()
      .regex(/^[a-zA-Z0-9._%]+@[a-zA-Z0-9._]+\.[a-zA-Z]{2,}$/, { error: 'Email invalide.' })
      .optional()
  ),

  password: z.string()
      .min(8, {error: 'Password must be at least 8 characters'})
      .max(100, {error: 'Password must be not exceed 100 characters'})
})

export type AuthFormState =
  | {
      errors?: {
        firstname?: string[]
        lastname?: string[]
        phoneNumber?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type ApiErrorResponse =
    {
        timestamp: string,
        status: number,
        error: string,
        message: string,
        path: string,
        fieldErrors: ApiFieldError[]
    };

type ApiFieldError = {field: string, message: string}