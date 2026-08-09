import { NextRequest, NextResponse } from 'next/server'

// ATTENTION : dans cette version de Next.js, `middleware.ts` a été renommé `proxy.ts`.
// Ce fichier DOIT rester à la racine du projet (à côté de `app/`), pas dans `app/`.
// Voir node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md

// Déjà fait pour toi : la liste des routes protégées (nécessitent d'être connecté) et
// publiques (accessibles sans être connecté). Ajoute-y des routes au fur et à mesure
// que tu construis le reste de l'app.
const protectedRoutes = ['/dashboard']
const publicRoutes = ['/login', '/signup', '/']

// ────────────────────────────────────────────────────────────────────────────
// Notions JS/TS utilisées ici :
//
// req.cookies.get(name)?.value
//   ⚠️ Différent de `cookies()` utilisé dans session.ts/dal.ts ! Ici, `req` est l'objet
//   NextRequest de la requête entrante, et `req.cookies.get()` est SYNCHRONE (pas de
//   `await`) — contrairement au helper `cookies()` de 'next/headers' qui, lui, est
//   asynchrone. Deux APIs différentes pour deux contextes différents (proxy vs Server
//   Component vs Server Action), à ne pas confondre.
//
// NextResponse.redirect(url) vs NextResponse.next()
//   `.redirect(url)` renvoie une réponse HTTP 307 qui redirige le navigateur.
//   `.next()` laisse la requête continuer normalement vers la route demandée —
//   l'équivalent de `filterChain.doFilter(request, response)` dans un Filter Servlet
//   qui ne bloque rien et laisse passer.

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  // TODO(1): lis le cookie de session directement ici (voir la note ci-dessus sur
  // req.cookies.get, PAS le cookies() async des autres fichiers).
  //   const session = req.cookies.get('session')?.value
  //
  // Ne fais PAS d'appel réseau à ton backend ici : le proxy tourne sur chaque requête
  // (y compris les prefetch de <Link>), ce doit être une vérification "optimiste"
  // et rapide (on vérifie juste que le cookie existe, pas que le JWT est encore valide).
  // La vérification "solide" (décodage + expiration) se fait dans app/lib/dal.ts.

  // TODO(2): si route protégée et pas de cookie -> redirige vers /login.
  //   if (isProtectedRoute && !session) {
  //     return NextResponse.redirect(new URL('/login', req.nextUrl))
  //   }

  // TODO(3): si route publique ET déjà connecté -> redirige vers /dashboard.
  // Objectif : éviter qu'un utilisateur déjà connecté retombe sur le formulaire de
  // login. Attention à ne pas boucler : si tu inclus '/' dans publicRoutes et que
  // '/' devient un jour une page d'accueil que même un utilisateur connecté peut
  // visiter, exclus-la explicitement de cette redirection (ex: isPublicRoute mais
  // path !== '/').
  //   if (isPublicRoute && session) {
  //     return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  //   }

  return NextResponse.next()
}

// Exclut les fichiers statiques et les routes internes pour ne pas ralentir leur chargement.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
