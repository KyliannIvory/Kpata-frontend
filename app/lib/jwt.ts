import 'server-only'

// Décodage SEUL du JWT (aucune vérification de signature) : Next.js n'a pas le secret
// utilisé par Spring Boot pour signer le token, donc il ne peut pas prouver
// cryptographiquement que le contenu n'a pas été falsifié.
//
// Pourquoi c'est acceptable ici : ce token ne peut avoir été écrit dans le cookie que
// par notre propre serveur (app/actions/auth.ts), juste après une réponse 2xx de
// /auth/login ou /auth/signup. On ne décode donc que pour LIRE des infos (expiration,
// numéro de téléphone, rôles), jamais pour authentifier une requête vers une source
// tierce.
//
// LIMITE À CONNAÎTRE : sans endpoint /auth/me côté backend, ce décodage local est notre
// seule source de vérité. Il ne peut pas savoir si le token a été révoqué entre-temps
// (ex: la blacklist de logout existe dans AuthService mais n'est exposée par aucune
// route pour l'instant). Le jour où un endpoint de vérification existe, remplace les
// usages de ce fichier dans app/lib/dal.ts par un vrai appel réseau.

export type JwtPayload = {
  sub: string // le numéro de téléphone (subject du token, confirmé côté backend)
  auth?: string // les rôles — vérifie le format exact avec un vrai token (colle-le sur jwt.io)
  exp: number // timestamp UNIX en SECONDES (pas millisecondes — attention à *1000)
  iat?: number
}

export function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}
