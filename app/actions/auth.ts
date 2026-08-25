'use server'

import {LoginFormSchema, SignupFormSchema, AuthFormState, ApiErrorResponse} from '@/app/lib/definitions'
import {createSession, deleteSession, getSession} from '@/app/lib/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {groupFieldErrors} from "@/app/lib/api-errors";


function getApiUrl(): string {
  const url = process.env.API_URL;

  if (!url) {
    throw new Error('API_URL manquante: vérifier le fichier .env')
  }

  return url;
}

async function authenticateAndRedirect(
  url: string,
  body: Record<string, unknown>
): Promise<AuthFormState> {

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      message: 'Impossible de contacter le serveur.'
    }
  }

  if (!res.ok) {
    const errorBody: ApiErrorResponse = await res.json();
    return { errors: groupFieldErrors(errorBody), message: errorBody.message }
  }

  const { token } = await res.json();

  if (!token) {
    return { message: 'Réponse serveur invalide.' }
  }

  await createSession(token);

  redirect('/dashboard');
}

export async function login(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {

  const validatedFields = LoginFormSchema.safeParse({
    phoneNumber: formData.get('phoneNumber'),
    password: formData.get('password'),
  });

  if (!validatedFields.success){
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors
    }
  }

  return authenticateAndRedirect(`${getApiUrl()}/auth/login`, validatedFields.data)
}

export async function signup(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {

  const validatedFields = SignupFormSchema.safeParse({
    firstname: formData.get('firstname'),
    lastname: formData.get('lastname'),
    phoneNumber: formData.get('phoneNumber'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success){
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors
    }
  }

  return authenticateAndRedirect(`${getApiUrl()}/auth/signup`, validatedFields.data)
}

export async function logout() {

  const token = await getSession();

  if (token) {
    try {
      await fetch(`${getApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
  }

  await deleteSession()
  redirect('/login')
}
