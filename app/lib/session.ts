import 'server-only'
import { cookies } from 'next/headers'

// Ce fichier gère UNIQUEMENT le cookie qui stocke le token renvoyé par ton API backend.
// Il ne fait ni hashing ni vérification de mot de passe : ton backend s'en occupe déjà.
//
// Pourquoi httpOnly + secure + sameSite ?
// -> httpOnly : le JS du navigateur ne peut pas lire le cookie (protège contre le vol
//    de token via une faille XSS).
// -> secure : le cookie n'est envoyé que sur HTTPS (en dev localhost, Next.js tolère http).
// -> sameSite: 'lax' : limite l'envoi du cookie sur des requêtes cross-site (protège
//    contre certaines attaques CSRF).

const SESSION_COOKIE_NAME = 'session'

// ────────────────────────────────────────────────────────────────────────────
// Notions JS/TS utilisées ici :
//
// new Date(ms)
//   Le constructeur `Date` de JS attend des MILLISECONDES depuis epoch (1970-01-01),
//   alors que le claim `exp` d'un JWT est en SECONDES (norme JWT, RFC 7519). D'où le
//   `* 1000` — un piège classique si tu oublies, le cookie expirerait en 1970, donc
//   immédiatement.
//
// cookies() (de 'next/headers')
//   API Next.js (pas du JS standard) pour lire/écrire les cookies HTTP côté serveur.
//   Elle est asynchrone (`await cookies()`) car en interne elle peut avoir besoin
//   d'attendre le contexte de la requête en cours.
//
// cookieStore.set(name, value, options)
//   Équivalent de `response.addCookie(new Cookie(...))` en Servlet/Spring, mais sous
//   forme d'un objet d'options au lieu de setters chaînés (`.setHttpOnly(true)`, etc.)

export async function createSession(token: string) {
  // TODO(1): décode le token pour connaître sa VRAIE expiration.
  // ⚠️ Ne fige JAMAIS une durée fixe en dur (genre "+5 minutes") : la valeur actuelle
  // (jwt.expiration: 300000 en dev côté Spring) est une config temporaire qui va changer.
  //
  //   const { exp } = decodeJwt(token)   // decodeJwt est déjà importé plus bas à ajouter
  //   const expiresAt = new Date(exp * 1000)
  //
  // N'oublie pas d'ajouter l'import en haut du fichier :
  //   import { decodeJwt } from '@/app/lib/jwt'

  // TODO(2): écris le cookie avec cette expiration réelle.
  //
  //   const cookieStore = await cookies()
  //   cookieStore.set(SESSION_COOKIE_NAME, token, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'lax',
  //     expires: expiresAt,
  //     path: '/',
  //   })
  //
  // Bénéfice de caler `expires` sur le vrai `exp` du JWT : le navigateur supprime le
  // cookie tout seul dès que le token expire. proxy.ts (vérif "cookie existe ?") reste
  // donc correct sans avoir à décoder quoi que ce soit à chaque requête.
}

export async function getSession(): Promise<string | undefined> {
  // Déjà fait pour toi (lecture simple, rien de nouveau par rapport à createSession) :
  // lit le cookie et retourne sa valeur (le JWT brut), ou undefined s'il n'existe pas.
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
