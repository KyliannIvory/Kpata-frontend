import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

// Data Access Layer : LE point central par lequel passe toute vérification d'auth
// côté serveur (Server Components, autres Server Actions, Route Handlers protégées).
//
// MIS À JOUR (voir docs/questions-backend.md) : GET /auth/me existe maintenant côté
// backend et renvoie UserDto { firstname, lastname, phoneNumber, email, roles }, avec
// `roles` = tableau des noms bruts de l'enum SANS préfixe "ROLE_" (ex: ["CUSTOMER"]).
// Décision prise (option A) : verifySession() appelle CE endpoint directement à
// chaque fois, plutôt que de se contenter d'un décodage local du JWT — c'est
// maintenant une vraie vérification côté serveur (401 si expiré OU blacklisté après
// un logout, ce qu'un décodage local ne pouvait pas détecter). Pas de rate limiting
// côté backend sur cette route, donc pas de coût à anticiper.
//
// Conséquence : jwt.ts (décodage local) n'est plus utilisé ici — il reste utile
// uniquement à session.ts (calcul de la date d'expiration du cookie).
//
// `cache()` évite de refaire l'appel réseau plusieurs fois pendant le rendu d'une même
// page (plusieurs composants peuvent appeler verifySession()/getUser()).
//
// ⚠️ IMPORTANT (sécurité) : même avec un vrai appel réseau, verifySession()/getUser()
// ne doivent servir QUE pour l'UX côté Next.js (afficher/masquer un lien, éviter
// d'envoyer une page protégée à quelqu'un de clairement déconnecté) — jamais comme
// unique rempart avant une action sensible. Le VRAI contrôle d'accès reste toujours
// côté Spring Boot : chaque appel à une route protégée doit envoyer
// `Authorization: Bearer <token>`, et c'est le filtre JWT de Spring Security qui fait
// foi. La différence avec avant : ici, au moins, /auth/me EST cet appel réel — mais
// rien n'empêche un token qui aurait pu être altéré entre `getSession()` et l'envoi
// du header d'être simplement rejeté par le backend (comportement voulu), donc le
// principe reste le même : ne jamais faire confiance à `roles` récupéré ici pour
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

const API_URL = process.env.API_URL
// Même remarque que app/actions/auth.ts:9 (TODO(review-1) là-bas) : si API_URL n'est
// pas définie, le fetch ci-dessous part vers "undefined/auth/me" — pas propre à ce
// fichier, mais vaut le coup d'y penser en même temps si tu factorises un jour cette
// vérification.

export const verifySession = cache(async () => {
  const token = await getSession()

  if (!token) {
    redirect('/login')
  }

  // TODO(1): appelle GET /auth/me avec le token en Bearer.
  //
  //   const res = await fetch(`${API_URL}/auth/me`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //
  // Contrairement à l'ancien décodage local, cette requête EST la vraie vérification
  // côté serveur : le backend rejette un token expiré, corrompu, ou blacklisté après
  // un logout (le décodage local ne pouvait détecter aucun de ces trois cas). Voir
  // docs/questions-backend.md — pas de rate limiting sur cette route, donc l'appeler
  // à chaque visite d'une page protégée n'a pas de coût serveur à anticiper.

  // TODO(review-1) : deux façons pour cet appel d'échouer, à traiter TOUTES LES DEUX
  //   comme "pas authentifié -> redirect('/login')" :
  //   - `!res.ok` (401 si expiré/invalide/blacklisté — voir le contrat d'erreur
  //     ErrorResponseDto, mais ici tu n'as pas besoin de lire le corps de l'erreur,
  //     juste de rediriger)
  //   - `fetch()` qui THROW (backend injoignable — pas la même chose qu'un 401, donc
  //     à couvrir avec un try/catch autour du TODO(1), comme pour les fetch de
  //     auth.ts)
  //   Repère Spring : même réflexe qu'un filtre de sécurité qui attrape une
  //   `JwtException` ou un timeout et renvoie 401, plutôt que de laisser planter la
  //   requête en 500.

  // TODO(2): si res.ok, parse et retourne le UserDto reçu.
  //   return await res.json() as { firstname: string, lastname: string,
  //     phoneNumber: string, email: string, roles: string[] }
  //
  // Rappel sécurité (voir la note en haut du fichier) : `roles` récupéré ici ne doit
  // servir qu'à des choix d'AFFICHAGE (ex: montrer un lien "Administration"), jamais à
  // décider tout seul qu'une action sensible est autorisée — cette décision reste
  // toujours à Spring Boot, sur l'appel API réel avec le token en Bearer.
})

export const getUser = cache(async () => {
  // Avec l'option A, verifySession() a déjà tout récupéré (UserDto complet) — ce
  // n'est donc plus qu'un alias de lecture, gardé séparé pour la lisibilité côté
  // appelant (ex: dashboard/page.tsx). Grâce à cache(), même si les deux fonctions
  // sont appelées dans la même page, un seul appel réseau à /auth/me est fait.
  return await verifySession()
})
