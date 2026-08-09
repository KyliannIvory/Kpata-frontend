import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import { decodeJwt } from '@/app/lib/jwt'

// Data Access Layer : LE point central par lequel passe toute vérification d'auth
// côté serveur (Server Components, autres Server Actions, Route Handlers protégées).
//
// LIMITATION CONNUE (voir docs/auth-architecture.md) : le backend n'expose pas encore
// de /auth/me. Tant que ce n'est pas le cas, cette "vérification" reste locale et
// optimiste : on décode le JWT stocké dans le cookie, sans jamais confirmer auprès de
// Spring Boot qu'il est toujours valide côté serveur (ex: pas encore blacklisté après un
// logout — la blacklist existe dans AuthService mais aucune route ne l'expose pour
// l'instant). Remplace ce décodage local par un vrai appel réseau (ex: GET /auth/me avec
// `Authorization: Bearer <token>`) dès qu'un tel endpoint existe côté backend.
//
// `cache()` évite de redécoder le token plusieurs fois pendant le rendu d'une même page
// (plusieurs composants peuvent appeler verifySession()).

// ────────────────────────────────────────────────────────────────────────────
// Notions JS/TS utilisées ici :
//
// Date.now()
//   Retourne l'horodatage actuel en MILLISECONDES (comme System.currentTimeMillis()
//   en Java). `payload.exp`, lui, est en SECONDES — même piège de conversion que dans
//   session.ts, d'où le `* 1000` dans la comparaison ci-dessous.
//
// Pourquoi `redirect()` sans `return` juste après ?
//   `redirect()` interrompt déjà l'exécution en interne (voir la note dans auth.ts) —
//   le code après ne s'exécute jamais dans ce chemin. Tu peux quand même ajouter un
//   `return` par lisibilité/habitude, TypeScript ne t'y oblige pas ici.

export const verifySession = cache(async () => {
  const token = await getSession()

  if (!token) {
    redirect('/login')
  }

  // TODO(1): decode + vérifie l'expiration.
  //
  //   const payload = decodeJwt(token)
  //   if (payload.exp * 1000 < Date.now()) {
  //     redirect('/login')
  //   }
  //
  // Défense en profondeur : le cookie expire normalement tout seul au même moment
  // (voir session.ts), mais ne présume jamais que le token n'a pas pu être manipulé
  // avant d'arriver ici — ce genre de double-vérification est exactement ce que tu
  // ferais côté Spring avec un filtre qui revalide un JWT même si un load balancer en
  // amont a déjà fait un premier contrôle.

  // TODO(2): retourne les infos minimales utiles à partir du même payload décodé.
  //   return { phoneNumber: payload.sub, roles: payload.auth }
  // (pas besoin de rappeler decodeJwt(token) une deuxième fois, réutilise `payload`
  // du TODO(1) ci-dessus)
  return { isAuth: true }
})

export const getUser = cache(async () => {
  const session = await verifySession()
  if (!session) return null

  // ⚠️ Sans /auth/me, tu ne peux récupérer QUE ce que le JWT contient (téléphone,
  // rôles). Pas de prénom/nom/email disponibles ici tant que le backend n'expose pas
  // ces infos (nouveaux claims JWT, ou un vrai endpoint /me à demander côté backend).

  return null
})
