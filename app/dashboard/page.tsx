import { verifySession, getUser } from '@/app/lib/dal'
import { logout } from '@/app/actions/auth'

// Page volontairement minimale : juste de quoi vérifier que le flow complet marche
// (login/signup -> cookie -> redirect -> cette page protégée -> logout).
// Server Component par défaut : pas besoin de 'use client' ici, il n'y a aucune
// interactivité propre à cette page (le bouton logout appelle une Server Action
// directement via <form>, voir TODO(3)).

// ────────────────────────────────────────────────────────────────────────────
// Notions JS/TS utilisées ici :
//
// async function DashboardPage()
//   Un Server Component PEUT être une fonction `async` qui fait des `await` dans son
//   corps directement (contrairement à un Client Component, où `useState`/hooks ne
//   supportent pas ça — c'est pour ça que useActionState existe côté client). Ici pas
//   besoin de hook : le rendu attend juste que verifySession() se résolve avant de
//   produire le HTML, un peu comme un contrôleur Spring MVC qui attend le résultat
//   d'un `@Service` avant de choisir la vue à retourner.
//
// { phoneNumber, roles } = await verifySession()
//   Déstructuration directe du résultat, comme `{ token }` dans auth.ts.

export default async function DashboardPage() {
  // TODO(1): appelle verifySession() (app/lib/dal.ts) et récupère son résultat.
  //   const { phoneNumber, roles } = await verifySession()
  // (adapte les noms de propriétés à ce que tu as réellement retourné au TODO(2) de
  // dal.ts). Si le cookie est absent/expiré, verifySession() redirige déjà vers /login
  // toute seule (voir le redirect() dans dal.ts) — pas besoin de re-vérifier ici, cette
  // ligne ne "continue" que si l'utilisateur est bien authentifié.

  // TODO(2): affiche ces infos dans le JSX ci-dessous (remplace le <p>Connecté.</p>).
  //   <p>Connecté en tant que {phoneNumber}</p>
  // Rappel : tant que /auth/me n'existe pas côté backend, ce sont uniquement les infos
  // qu'on a pu décoder localement depuis le JWT (voir app/lib/jwt.ts et dal.ts) — pas
  // de prénom/nom/email disponibles ici.

  return (
    <div>
      {/* TODO(2) : remplace ceci par les vraies infos utilisateur */}
      <p>Connecté.</p>

      {/* TODO(3): bouton logout.
          <form action={logout}>
            <button type="submit">Se déconnecter</button>
          </form>
          Comme pour les formulaires login/signup, <form action={...}> invoque
          directement la Server Action `logout` — pas besoin de useActionState ici
          puisqu'il n'y a ni champ à valider ni erreur à afficher.
      */}
    </div>
  )
}
