import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

// Point central de vérification d'authentification côté serveur (Server Components,
// Server Actions, Route Handlers protégées). Appelle GET /auth/me : un token expiré,
// corrompu ou blacklisté est donc rejeté par le backend lui-même.
//
// Sécurité : verifySession()/getUser() ne servent qu'à l'UX (afficher/masquer un
// lien, éviter d'envoyer une page protégée à un utilisateur déconnecté) — jamais
// comme unique rempart avant une action sensible. Le contrôle d'accès réel reste
// côté Spring Boot, via `Authorization: Bearer <token>` sur chaque appel protégé.

const API_URL = process.env.API_URL

export const verifySession = cache(async () => {
  const token = await getSession()

  if (!token) {
    redirect('/login')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    redirect('/login')
  }

  if (!res.ok) {
    redirect('/login')
  }

  return await res.json() as {
    firstname: string
    lastname: string
    phoneNumber: string
    email: string
    roles: string[]
  }
})

export const getUser = cache(async () => {
  // Alias de lecture : verifySession() a déjà tout récupéré, cache() évite un
  // second appel réseau si les deux fonctions sont appelées sur la même page.
  return await verifySession()
})
