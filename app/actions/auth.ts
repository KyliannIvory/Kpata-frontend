'use server'

import { LoginFormSchema, SignupFormSchema, AuthFormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'


const API_URL = process.env.API_URL;
// TODO(review-1): si API_URL n'est pas définie (oubli dans .env, mauvaise config en
//   prod), le template string `${API_URL}/auth/login` devient silencieusement
//   "undefined/auth/login" — le fetch part quand même et échoue avec une erreur réseau
//   confuse à déboguer. Ajoute une vérification fail-fast ici, ex :
//     if (!API_URL) {
//       throw new Error('API_URL manquante : vérifie ton fichier .env')
//     }
//   Question à te poser : pourquoi vaut-il mieux lever cette erreur ICI, au chargement
//   du module, plutôt qu'attendre le premier login raté pour la découvrir ?

// TODO(review-2): login() et signup() partagent maintenant un squelette quasi
//   identique (fetch -> vérifier res.ok -> extraire { token } -> createSession ->
//   redirect). Une fois les deux fonctions bien comprises, réfléchis à factoriser ce
//   squelette dans une fonction privée commune (ex: un helper
//   `authenticateAndRedirect(url, body, errorMessage)` appelé par les deux). Pas
//   urgent — pose-toi plutôt la question : qu'est-ce que tu gagnerais à extraire
//   maintenant, et qu'est-ce que ça te coûterait si login et signup se mettent à
//   diverger plus tard (ex: signup doit un jour faire autre chose avant de rediriger) ?

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

  // TODO(review-3): fetch() peut THROW une vraie exception JS si le backend est
  //   injoignable (down, timeout, DNS...) — ce n'est PAS la même chose qu'un `res.ok`
  //   à false, et ce n'est pas géré par le `if (!res.ok)` juste en dessous. Enveloppe
  //   le fetch (et lui seul) dans un try/catch, et retourne un message générique dans
  //   le catch, ex: { message: 'Impossible de contacter le serveur.' }
  //   ⚠️ Piège : ton try/catch ne doit englober QUE le fetch, jamais le redirect()
  //   plus bas — sinon tu risques d'intercepter par erreur l'exception interne que
  //   redirect() utilise pour fonctionner (voir le commentaire à ce sujet plus bas).
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: validatedFields.data.phoneNumber,
      password: validatedFields.data.password,
    })
  });

  if (!res.ok) {
    return { message: "Numéro ou mot de passe invalide."}
  }

  const { token } = await res.json();
  // TODO(review-4): res.json() te fait confiance aveugle sur la forme de la réponse.
  //   Si le backend renvoie un jour un 200 sans champ `token` (bug, contrat cassé...),
  //   `token` vaudrait `undefined` ici et tu appellerais createSession(undefined) sans
  //   t'en rendre compte. Ajoute une vérification minimale avant d'appeler
  //   createSession, ex: `if (!token) return { message: 'Réponse serveur invalide.' }`
  await createSession(token);

  redirect('/dashboard');

  return undefined
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

  // TODO(review-3): même remarque que login() TODO(review-3) — gère la panne réseau
  //   (fetch qui throw) avec un try/catch autour de CE fetch uniquement.
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstname: validatedFields.data.firstname,
      lastname: validatedFields.data.lastname,
      phoneNumber: validatedFields.data.phoneNumber,
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    })
  });

  if (!res.ok) {
    return { message: 'Une erreur est survenue.' }
  }

  const { token } = await res.json();
  // TODO(review-4): même remarque que login() TODO(review-4) — vérifie que `token`
  //   existe avant d'appeler createSession.
  await createSession(token);

  redirect('/dashboard');

  return undefined
}

export async function logout() {
  // Pas de route de logout exposée côté backend pour l'instant (AuthService.logout()
  // existe et gère une blacklist, mais AuthController ne l'expose sur aucune route) :
  // on se contente de supprimer le cookie local. Le jour où une route existe, ajoute
  // l'appel à cette route ICI, avant deleteSession(), pour que le token soit aussi
  // invalidé côté serveur.
  await deleteSession()
  redirect('/login')
}
