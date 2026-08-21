import 'server-only'
import { cookies } from 'next/headers'
import { decodeJwt } from '@/app/lib/jwt'

// Ce fichier gère UNIQUEMENT le cookie qui stocke le token renvoyé par l'API backend
// (hashing/vérification du mot de passe : déjà fait côté Spring Boot).
//
// Choix des options de cookie, et pourquoi :
// - httpOnly : invisible pour le JS du navigateur — protège contre le vol du token via
//   une faille XSS (localStorage, lui, serait lisible par n'importe quel script de la
//   page).
// - secure : le cookie n'est envoyé que sur HTTPS (Next.js tolère http en dev localhost).
// - sameSite: 'lax' : limite l'envoi du cookie sur des requêtes cross-site — une
//   protection partielle contre le CSRF.
const SESSION_COOKIE_NAME = 'session'

export async function createSession(token: string) {

  // `exp` (claim JWT standard, RFC 7519) est en SECONDES depuis epoch, alors que le
  // constructeur `Date` de JS attend des MILLISECONDES — d'où le `* 1000`. Piège
  // classique si oublié : le cookie expirerait en 1970, donc immédiatement.
  //
  // TODO(review-1): decodeJwt() (app/lib/jwt.ts) ne fait AUCUNE vérification — ni
  //   signature, ni présence des claims attendus. Si `token` est malformé (payload
  //   invalide, `exp` absent...), decodeJwt() peut soit throw (atob/JSON.parse sur du
  //   contenu invalide), soit renvoyer un objet sans `exp` -> `new Date(undefined *
  //   1000)` = Invalid Date, et cookieStore.set() avec une date d'expiration invalide.
  //   Rien de tout ça n'est géré aujourd'hui : si ça arrive, ça remonte tel quel jusqu'à
  //   la Server Action appelante (login()/signup()) et fait planter la requête sans
  //   message clair pour l'utilisateur.
  //   Renforce ici : entoure ce bloc d'un try/catch, et/ou valide explicitement que
  //   `exp` est un nombre avant de construire `expiresAt`. Réfléchis à ce que doit
  //   renvoyer createSession() dans ce cas (elle n'a pas accès à AuthFormState ici,
  //   contrairement à login()/signup() — donc lève une erreur typée plutôt que de
  //   retourner un message) et à comment login()/signup() devraient l'attraper pour
  //   afficher un message propre à l'utilisateur plutôt qu'un crash.
  const { exp } = decodeJwt(token);
  const expiresAt = new Date(exp * 1000);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });

}

export async function getSession(): Promise<string | undefined> {

  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
