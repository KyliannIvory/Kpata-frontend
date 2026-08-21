import { NextRequest, NextResponse } from 'next/server'

// Dans cette version de Next.js, `middleware.ts` a été renommé `proxy.ts` — doit
// rester à la racine du projet (à côté de `app/`), pas dedans.

const protectedRoutes = ['/dashboard']
const publicRoutes = ['/login', '/signup', '/']

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  // Vérification optimiste (présence du cookie uniquement, pas d'appel réseau) : le
  // proxy tourne sur chaque requête, y compris les prefetch de <Link>. La vérification
  // solide (décodage, expiration, blacklist) se fait dans dal.ts. `req.cookies.get()`
  // est synchrone, contrairement au `cookies()` async de session.ts/dal.ts.
  const session = req.cookies.get('session')?.value

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

// Exclut les fichiers statiques et les routes internes pour ne pas ralentir leur chargement.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
