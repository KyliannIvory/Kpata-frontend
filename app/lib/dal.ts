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
//
// ⚠️ IMPORTANT (sécurité, à bien comprendre avant d'implémenter les TODO ci-dessous) :
// verifySession() ne vérifie PAS que le token est authentique — elle sait seulement le
// LIRE. jwt.ts ne connaît pas le secret utilisé par Spring Boot pour signer le JWT, donc
// rien ici ne peut prouver que le contenu n'a pas été trafiqué.
//
// Concrètement : `httpOnly` (voir session.ts) empêche uniquement le JAVASCRIPT de la
// page de lire/modifier le cookie — il n'empêche PAS l'utilisateur lui-même d'éditer la
// valeur de son propre cookie à la main (onglet "Application"/"Storage" des DevTools du
// navigateur). Rien n'empêche donc quelqu'un de forger un faux JWT avec un `exp` dans le
// futur et `auth: "ROLE_ADMIN"`, et de le coller dans son cookie.
//
// Conséquence pour la suite du projet : verifySession()/getUser() ne doivent servir QUE
// pour l'UX côté Next.js (afficher/masquer un lien, éviter d'envoyer une page protégée
// à quelqu'un de clairement déconnecté) — JAMAIS comme unique rempart avant une action
// sensible. Le VRAI contrôle d'accès reste toujours côté Spring Boot : chaque appel à
// une route protégée doit envoyer `Authorization: Bearer <token>`, et c'est le filtre
// JWT de Spring Security (qui, lui, connaît le secret et vérifie la signature) qui fait
// foi. Exactement comme tu ne ferais jamais confiance à un rôle lu côté client pour
// sauter un `@PreAuthorize` côté serveur.

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

  // TODO(review-1) [sécurité] : decodeJwt() ne valide rien (voir jwt.ts et la note en
  //   haut de ce fichier) — si le cookie contient une valeur corrompue ou trafiquée,
  //   decodeJwt() peut carrément THROW (ex: atob() appelé sur du contenu qui n'est pas
  //   du base64 valide). Contrairement à session.ts (où on n'a pas de "bonne" réponse
  //   de repli si ça échoue), ici tu as une porte de sortie évidente : traiter un token
  //   illisible exactement comme un token absent.
  //   Enveloppe le TODO(1) ci-dessus dans un try/catch, et dans le catch, appelle
  //   `redirect('/login')` au lieu de laisser l'exception remonter et planter la page.
  //   Repère Spring : c'est le même réflexe qu'un filtre de sécurité qui attrape une
  //   `JwtException` et renvoie 401, plutôt que de laisser planter la requête en 500.

  // TODO(2): retourne les infos minimales utiles à partir du même payload décodé.
  //   return { phoneNumber: payload.sub, roles: payload.auth }
  // (pas besoin de rappeler decodeJwt(token) une deuxième fois, réutilise `payload`
  // du TODO(1) ci-dessus)
  //
  // Rappel sécurité (voir la note en haut du fichier) : `roles` récupéré ici ne doit
  // servir qu'à des choix d'AFFICHAGE (ex: montrer un lien "Administration"), jamais à
  // décider tout seul qu'une action sensible est autorisée — cette décision reste
  // toujours à Spring Boot, sur l'appel API réel avec le token en Bearer.
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
