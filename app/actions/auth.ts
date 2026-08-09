'use server'

// Les Server Actions sont le pont entre tes formulaires (client) et TON API backend.
// Elles s'exécutent uniquement côté serveur : c'est ici, et seulement ici, qu'on doit
// parler à l'API (jamais depuis le client, sinon tu exposes ton URL/API-key inutilement
// et tu perds la validation serveur).

import { LoginFormSchema, SignupFormSchema, AuthFormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'


// Endpoints CONFIRMÉS (par curl) — pas de préfixe /api :
//   POST /auth/login  { phoneNumber, password }                        -> 200 { token }
//   POST /auth/signup { firstname, lastname, phoneNumber, password, email } -> 201 { token }
//

const API_URL = process.env.API_URL;
//
// ⚠️ BUG BACKEND CONNU, en cours de correction : actuellement TOUTES les erreurs
// (identifiants invalides, téléphone déjà utilisé, validation @Valid) renvoient un 401
// avec un corps VIDE — au lieu des 401/409/400 avec message prévus à terme. Tant que ce
// n'est pas confirmé corrigé, contente-toi d'un message générique sur `!res.ok`. Ne perds
// pas de temps à écrire un mapping fin par code de statut, tu devrais tout refaire.

// ────────────────────────────────────────────────────────────────────────────
// Notions JS/TS utilisées dans ce fichier (nouvelles pour toi, donc détaillées une
// seule fois ici — elles reviennent à l'identique dans login() et signup()) :
//
// fetch(url, options) -> Promise<Response>
//   L'équivalent bas-niveau d'un RestTemplate/WebClient, mais intégré au langage (pas
//   d'import). `options.body` doit être une STRING, pas un objet JS — d'où
//   JSON.stringify({...}) pour sérialiser toi-même (contrairement à Spring, qui
//   sérialise automatiquement un @RequestBody).
//
// await
//   fetch() (et res.json() plus bas) retournent une Promise, pas la valeur directement.
//   `await` "déballe" cette Promise et donne la vraie valeur — c'est pour ça que login()
//   et signup() sont déjà déclarées `async function` dans le fichier.
//
// res.ok  (sur l'objet Response renvoyé par fetch)
//   ⚠️ Piège n°1 pour quelqu'un qui vient de Java : contrairement à RestTemplate, fetch
//   NE LÈVE PAS d'exception sur un 4xx/5xx. Il faut vérifier `res.ok` toi-même (true si
//   le status est 200-299 — donc ça couvre aussi bien 200 que 201, pas besoin de tester
//   `res.status === 200` précisément). fetch ne rejette (throw) QUE sur une vraie panne
//   réseau (serveur injoignable), pas sur une réponse HTTP d'erreur.
//
// res.json() -> Promise<any>
//   Parse le corps de la réponse en JSON (équivalent d'un ObjectMapper.readValue), donc
//   ça s'attend aussi avec `await`. Ne peut être lu qu'UNE seule fois par réponse.

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




  // TODO(2): appelle ton backend. Complète les ... :
  //
  //   const res = await fetch(`${API_URL}/auth/login`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ ... }), // <- les 2 champs validés, récupérés sur
  //                                    //    validatedFields.data (pas formData.get(),
  //                                    //    tu veux les valeurs déjà validées/trimées)
  //   })
  //
  //   if (!res.ok) {
  //     return { message: 'Numéro ou mot de passe invalide.' }
  //   }
  //
  // Pourquoi `validatedFields.data` et pas `formData.get('phoneNumber')` à nouveau ?
  // Parce que `safeParse` a déjà fait le travail de validation ET de nettoyage (ex: le
  // `.trim()` qu'on a mis sur firstname/lastname côté signup) — pas besoin de relire le
  // FormData brut une deuxième fois.

  // TODO(3): récupère le token renvoyé par l'API, puis crée la session.
  //
  //   const { token } = await res.json()
  //   await createSession(token)
  //
  // `{ token }` ici, c'est de la déstructuration d'objet JS : équivalent de faire
  // `String token = response.token();` si `res.json()` te renvoyait un record Java.

  // TODO(4): redirige l'utilisateur connecté.
  //   redirect('/dashboard')
  // Rappel important : redirect() interrompt l'exécution en interne (il "throw" une
  // exception spéciale que Next.js intercepte lui-même) — donc si un jour tu entoures
  // ce code d'un try/catch pour gérer une panne réseau sur le fetch, NE catch PAS cette
  // exception par erreur (ne mets pas redirect() à l'intérieur du try, ou re-throw les
  // erreurs qui ne t'appartiennent pas). Pas la peine d'ajouter ce try/catch pour l'instant,
  // c'est juste un piège à connaître pour plus tard.

  return undefined
}

export async function signup(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // TODO(1): même pattern que login() TODO(1) — safeParse + z.flattenError si invalide.
  //   const validatedFields = SignupFormSchema.safeParse({
  //     firstname: formData.get('firstname'),
  //     lastname: formData.get('lastname'),
  //     phoneNumber: formData.get('phoneNumber'),
  //     email: formData.get('email'),
  //     password: formData.get('password'),
  //   })
  // N'oublie pas le `if (!validatedFields.success) return { errors: ... }` avant de
  // continuer (sinon TypeScript te bloquera de toute façon à l'étape suivante : tant
  // que `safeParse` n'a pas confirmé le succès, `validatedFields.data` n'existe pas
  // pour le compilateur — c'est voulu, ça t'empêche d'oublier ce return).

  // TODO(2): appelle ton backend, même pattern que login() TODO(2).
  //   const res = await fetch(`${API_URL}/auth/signup`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ ... }), // <- les 5 champs, depuis validatedFields.data
  //   })
  //   if (!res.ok) {
  //     return { message: '...' }
  //   }
  // Confirmé par curl : succès = 201 + { token }. Rappel : `res.ok` couvre 200-299,
  // donc 201 passe le test sans que tu aies à le traiter différemment de 200.

  // TODO(3): identique à login() TODO(3)/(4) : extraire { token }, createSession(token),
  // puis redirect() vers la même route que login (l'utilisateur est connecté direct
  // après signup, confirmé par curl — pas d'étape de vérification email).

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
