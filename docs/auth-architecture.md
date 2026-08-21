# Architecture Signup/Login — pourquoi cette structure

Ce document explique le squelette créé pour `/login` et `/signup`, fichier par fichier,
dans l'ordre où tu devrais les implémenter.

Public visé : toi — dev backend Spring Boot, qui connaît React de base (composants,
JSX, hooks comme `useState`) mais pas encore Next.js, et pas vraiment TypeScript. Chaque
concept Next.js est donc relié à son équivalent Spring Boot. Il y a aussi un mini-primer
TypeScript à la fin, pour lire le code sans être bloqué par la syntaxe.

C'est la structure **recommandée par la documentation officielle** de cette version de
Next.js (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`) — ce n'est
pas un choix arbitraire de ma part.

## Où j'en suis (à tenir à jour au fur et à mesure)

Ce tableau est la source de vérité pour reprendre le travail sans avoir à se souvenir de
la conversation qui a produit ce squelette — utile en particulier si tu changes de
machine. Coche/mets à jour la colonne Statut toi-même à chaque fichier terminé ; c'est un
réflexe utile au-delà de ce projet (n'importe quelle codebase pro bénéficie d'un état des
lieux écrit quelque part plutôt que dans la tête de quelqu'un).

| Fichier | Statut | Où j'en suis exactement |
|---|---|---|
| `app/lib/definitions.ts` | ✅ fait | Schémas écrits et fonctionnels. Le `TODO(normalize-phone)` a été retiré le 2026-08-18 : le backend normalise maintenant lui-même vers E.164 (voir "Limites connues actuelles du backend" plus bas), donc plus besoin d'un `.transform()` côté frontend pour garantir un compte unique. Ajouté le 2026-08-21 : `ApiErrorResponse`/`ApiFieldError`, le miroir TypeScript de l'`ErrorResponseDto` backend, utilisé par `app/lib/api-errors.ts` et `app/actions/auth.ts` pour typer la réponse d'erreur avant mapping. |
| `app/ui/auth/form-field.tsx` | ✅ fait | Composant réutilisable extrait pour éviter la duplication label+input+erreurs. Affiche déjà plusieurs erreurs par champ (tableau) — pas de changement à faire même une fois `fieldErrors` mappé. |
| `app/ui/auth/login-form.tsx` | ✅ fait | Utilise `FormField` pour phoneNumber/password |
| `app/ui/auth/signup-form.tsx` | ✅ fait | Utilise `FormField` pour les 5 champs |
| `app/(auth)/layout.tsx` | ✅ fait | Carte centrée (design) |
| `app/(auth)/login/page.tsx` | ✅ fait | Titre + `LoginForm` + lien vers `/signup` |
| `app/(auth)/signup/page.tsx` | ✅ fait | Titre + `SignupForm` + lien vers `/login` |
| `app/globals.css` | ✅ fait | Styles de base (design) pour `input`/`label`/`button`/`h1`/`a`, variables de couleur clair/sombre |
| `app/lib/jwt.ts` | ✅ fait | `decodeJwt` toujours utilisé par `session.ts` (calcul d'expiration du cookie). N'est plus utilisé par `dal.ts` depuis que `verifySession()` appelle `/auth/me` directement. |
| `app/lib/api-errors.ts` | ✅ fait | `groupFieldErrors(apiResponse: ApiErrorResponse)` regroupe `fieldErrors` par `field` en `Record<string, string[]>` (plusieurs messages possibles pour un même champ). Utilisé par `auth.ts` pour construire `AuthFormState.errors`. |
| `app/actions/auth.ts` | ✅ fait | `login()`/`signup()` : validation Zod propre à chacun, puis délégation à une fonction privée commune `authenticateAndRedirect(url, body)` (fetch, mapping d'erreur via `ApiErrorResponse`/`groupFieldErrors`, vérification du `token`, `createSession()`, `redirect('/dashboard')`) — tous les `TODO(review-1/3/4)` et `TODO(map-errors)` sont résolus, `TODO(review-2)` (factorisation) traité par ce helper. `logout()` : appelle `POST /auth/logout` seulement si un `token` existe (`catch` silencieux si le backend est injoignable), puis `deleteSession()` + `redirect('/login')` dans tous les cas — `TODO(call-logout)` résolu. |
| `app/lib/session.ts` | ✅ fait | `createSession()`/`getSession()`/`deleteSession()` tous écrits et fonctionnels. `TODO(review-1)` restant = robustesse (try/catch si token malformé), pas bloquant. |
| `app/lib/dal.ts` | ✅ fait | `verifySession()` appelle `GET /auth/me` (`try/catch` + `!res.ok` → `redirect('/login')`) et retourne le `UserDto` parsé. `getUser()` délègue à `verifySession()`. |
| `proxy.ts` | ✅ fait | Lit `req.cookies.get('session')` : redirige vers `/login` si route protégée sans cookie, vers `/dashboard` si route publique avec cookie. `'/'` est dans `publicRoutes` — à exclure de cette redirection le jour où `/` devient une vraie page d'accueil consultable même connecté (`app/page.tsx` est encore le placeholder par défaut de Next.js). |
| `app/dashboard/page.tsx` | ⬜ à faire | **TODO(1)/(2)/(3) à écrire** (appel `verifySession()`/`getUser()`, affichage du `UserDto`, bouton logout). Attend que `dal.ts` soit fonctionnel avant de pouvoir être testé. |

**Ordre retenu : d'abord les fichiers 🚧 en cours, puis les ⬜ à faire.**

`app/actions/auth.ts`, `app/lib/dal.ts` et `proxy.ts` sont maintenant ✅ faits (voir
tableau ci-dessus) — reste :

1. `app/dashboard/page.tsx` (⬜ à faire) — `TODO(1)/(2)/(3)`. Peut maintenant être
   testé de bout en bout puisque `dal.ts` et `proxy.ts` sont fonctionnels.

Avant de commencer : `.env.local` a été créé à la racine avec
`API_URL=http://localhost:8080` — lance ton backend Spring Boot en local pour pouvoir
tester au fur et à mesure. Les contrats API utilisés dans les TODO ci-dessus (routes,
formats d'erreur, `UserDto`) sont documentés plus bas dans ce même document (sections
"Limites connues actuelles du backend" et "Le contrat d'erreur — référence complète").

**Question encore ouverte, non bloquante** : `API_URL` change-t-elle entre dev et prod,
ou reste-t-elle une constante fixe pour l'instant ? Pas de réponse vérifiée à ce jour —
à traiter si/quand un vrai déploiement prod est mis en place.

## Le changement de mental model le plus important

En Spring Boot, ton backend et ton frontend sont deux projets séparés : le backend
expose des `@RestController`, le frontend (React/Angular/autre) fait des `fetch`/`axios`
vers ces endpoints. Deux déploiements, deux bases de code.

**Next.js fusionne les deux dans un seul projet.** Un même fichier `.tsx` peut contenir
du code qui tourne uniquement côté serveur (jamais envoyé au navigateur) et du code qui
tourne dans le navigateur. C'est la distinction **Server Component / Client Component**,
et elle explique quasiment tous les choix de ce squelette. Prends le temps de bien
l'intégrer avant le reste :

- **Server Component** (comportement par défaut, aucune annotation) : équivalent d'une
  méthode `@RestController` ou d'un `@Service` — ce code s'exécute **uniquement sur le
  serveur**. Il peut lire des cookies, appeler une API, toucher des secrets
  (`process.env.API_URL`), sans jamais que ce code parte dans le navigateur. `page.tsx`
  et `layout.tsx` sont des Server Components par défaut.
- **Client Component** (le fichier commence par la ligne `'use client'`) : c'est le code
  qui est réellement compilé en JS et envoyé au navigateur, comme n'importe quel
  composant React "classique" que tu as pu voir jusqu'ici. Obligatoire dès que tu utilises
  `useState`, `useActionState`, `onClick`, ou toute interactivité.

Concrètement : `login-form.tsx` a `'use client'` en première ligne car il a besoin de
`useActionState` pour piloter l'affichage pendant la soumission. `login/page.tsx`, lui,
n'a pas besoin d'interactivité propre, donc reste un Server Component.

## Vue d'ensemble : le flux complet

```
Navigateur                Next.js (serveur)              Ton API Spring Boot
-----------                ------------------              ----------------
<form action={login}>
      |
      | submit (pas un vrai POST classique, voir plus bas)
      v
                          app/actions/auth.ts : login()
                          1. valide avec Zod (definitions.ts)
                          2. fetch(`${API_URL}/auth/login`) --> POST /auth/login
                             { phoneNumber, password }        { phoneNumber, password }
                                                          <----- 200 { token }
                          3. createSession(token)  (session.ts)
                             -> decodeJwt(token) pour lire `exp` (jwt.ts)
                             -> écrit un cookie httpOnly qui expire à ce `exp`
                          4. redirect('/dashboard')
      |
      v
  GET /dashboard
      |
      v
                          proxy.ts (tourne AVANT le rendu de la page)
                          - lit le cookie (vérif "optimiste", pas d'appel API)
                          - laisse passer ou redirige vers /login
      |
      v
                          app/dashboard/page.tsx (Server Component)
                          -> appelle verifySession() / getUser() (dal.ts)
                          -> GET /auth/me avec Authorization: Bearer <token>
                             (vraie vérification serveur, voir section dal.ts)
```

Deux vérifications distinctes, volontairement :
- **`proxy.ts`** = comme un `Filter` Servlet ou un `HandlerInterceptor.preHandle`
  enregistré sur `/*` : il tourne sur *chaque* requête (y compris les préchargements de
  liens que Next.js déclenche tout seul). Il ne doit jamais appeler ton API — juste
  regarder si le cookie existe, comme un filtre qui vérifie juste la présence d'un
  header `Authorization` sans valider le JWT en base.
- **`dal.ts`** = l'endroit qui joue le rôle de
  `AuthenticationManager`/`SecurityContext` que tu interrogerais réellement dans un
  `@Service` — vérif solide, appelée seulement quand une page a vraiment besoin des
  données utilisateur. `verifySession()` appelle directement `GET /auth/me` (voir la
  section dédiée plus bas) — ce n'est plus un décodage local du JWT, mais une vraie
  vérification côté serveur.

## Tableau de correspondance rapide

| Fichier Next.js | Rôle | Équivalent Spring Boot |
|---|---|---|
| `app/lib/definitions.ts` | Schémas de validation | DTO + annotations Bean Validation (`@NotBlank`, `@Email`, `@Size`) |
| `app/ui/auth/form-field.tsx` | Bloc label+input+erreurs réutilisable | Une méthode privée commune extraite entre deux `@Service`, ou un fragment Thymeleaf `th:fragment` réutilisé par deux templates |
| `app/ui/auth/*-form.tsx` | Formulaire (vue + interactivité) | Vue Thymeleaf/JSP + le JS qui l'accompagne |
| `app/(auth)/**/page.tsx` | Route/page | Méthode `@GetMapping` qui retourne une vue |
| `app/actions/auth.ts` | Logique appelée par le formulaire | `@RestController` / méthode `@PostMapping` |
| `app/lib/session.ts` | Écriture du cookie de session | `response.addCookie(...)` / config de cookie Spring Session |
| `app/lib/dal.ts` | Vérification d'authentification centralisée | `@Service` d'auth + `SecurityContextHolder` |
| `app/lib/jwt.ts` | Décode (sans vérifier) le payload d'un JWT | Un `JwtParser` sans vérification de signature — utilitaire, pas un `@Service` |
| `proxy.ts` | Interception globale avant le rendu | `Filter` Servlet / `SecurityFilterChain` |

## Limites connues actuelles du backend (à garder en tête)

Mis à jour le 2026-08-18, vérifié par les tests automatisés du backend
(`AuthControllerTest`, `AuthServiceTest`, `GlobalExceptionHandlerTest` — suite verte),
pas juste relu dans le code.

### Résolu depuis la première version de ce doc

| Ancienne limite | État actuel |
|---|---|
| Pas d'endpoint `/auth/me` | ✅ Existe, renvoie `UserDto { firstname, lastname, phoneNumber, email, roles }` |
| Pas de route de logout exposée | ✅ `POST /auth/logout` existe, `Authorization: Bearer` uniquement, `204 No Content` |
| Erreurs 401 à corps vide, pas de `@RestControllerAdvice` | ✅ Contrat unique `ErrorResponseDto` (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors[]`) sur toutes les routes d'auth — détail complet dans la section "Le contrat d'erreur" plus bas |
| `phoneNumber` accepté sous 2 formats (local/E.164), jamais normalisé avant stockage/comparaison — un même numéro sous 2 formats = 2 comptes différents | ✅ `AuthService` normalise vers E.164 en interne (signup ET login) — un même numéro sous 2 formats désigne maintenant le même compte. `app/lib/definitions.ts` n'a donc plus besoin d'un `.transform()`, et le `TODO(normalize-phone)` a été retiré (2026-08-18) |
| Email dupliqué au signup renvoie un `500` générique au lieu d'un `409` exploitable | ✅ `existsByEmailIgnoreCase` vérifié avant l'insertion (insensible à la casse) → `409 Conflict`, même contrat d'erreur que pour le téléphone |
| Contraintes backend sur `password` inconnues (le frontend impose 8–100 caractères, sans contrainte de complexité, sans confirmation que le backend correspond) | ✅ Confirmé dans `LoginRequestDto`/`SignupRequestDto` : `@Size(min = 8, max = 100)`, aucune contrainte de complexité additionnelle — identique au frontend, rien à ajuster |
| Forme JSON exacte de `roles` et valeurs possibles de l'enum `Role` inconnues | ✅ Confirmé (`Role.java`) : enum à 3 valeurs `CUSTOMER`, `PRO`, `ADMIN`, sérialisées telles quelles dans un tableau (ex. `["CUSTOMER"]`) — pas de préfixe `ROLE_` |

### Toujours vrai / nouveau

| Limite actuelle | Impact sur le frontend | Fichier concerné |
|---|---|---|
| `fieldErrors` peut contenir plusieurs entrées pour le même `field` (plusieurs contraintes violées) | Grouper par `field` en tableau, pas écraser — `AuthFormState.errors` est déjà typé `string[]` par champ, `FormField` affiche déjà chaque message | `app/actions/auth.ts`, `app/lib/definitions.ts` |
| `jwt.expiration` = 1 heure, une seule valeur pour tous les environnements (pas de config prod séparée) | Ne code aucune hypothèse UX sur cette durée précise, décode toujours le vrai `exp` | `app/lib/session.ts` |
| Pas de refresh token | Pas de `updateSession()` à écrire pour ce MVP | `app/lib/session.ts` |
| Pas de rate limiting sur `/auth/me`, ni sur aucune route d'ailleurs | Aucune contrainte technique n'empêche `verifySession()` de l'appeler à chaque visite de page protégée (option A retenue, voir tableau de statut plus haut) | `app/lib/dal.ts` |
| `GET /auth/me` et le `subject` du JWT renvoient toujours `phoneNumber` au format E.164, même si l'utilisateur a tapé le format local | Si `phoneNumber` est affiché dans l'UI (`UserDto`), attends-toi à ce format, pas au format tapé par l'utilisateur | `app/dashboard/page.tsx` (à écrire) |
| CORS **supprimé intentionnellement et de façon définitive** côté backend (bean, config, propriété — tout retiré, pas juste laissé permissif) | Sans objet pour ce projet — le navigateur ne parle jamais directement à Spring Boot. C'est un garde-fou volontaire : si un jour du code frontend appelait l'API directement depuis le navigateur par erreur, l'absence de CORS fait échouer la requête au lieu de la laisser passer silencieusement (voir section CORS plus bas) | — |

## Spécificités de l'intégration avec ton API Spring Boot

Points où la réalité de "backend = Spring Boot, authentification par téléphone" change
concrètement ce que tu vas écrire dans les `TODO`.

### CORS : normalement tu n'en as pas besoin

Réflexe classique quand on a déjà galéré avec `@CrossOrigin`/`CorsConfigurationSource` :
se dire qu'il va falloir autoriser `http://localhost:3000` côté Spring Security. **Ce
n'est pas le cas ici**, et c'est important de comprendre pourquoi : CORS est une
protection du **navigateur**, qui s'applique quand du JS tournant dans une page
`origin A` appelle une API sur `origin B`. Or dans cette architecture, le navigateur
n'appelle jamais directement ton API Spring Boot — c'est toujours le serveur Next.js
(dans `app/actions/auth.ts` et `app/lib/dal.ts`, tous les deux exécutés côté serveur, pas
dans le navigateur) qui fait le `fetch`. Un appel serveur-à-serveur n'est jamais soumis à
CORS, exactement comme deux microservices qui s'appellent en interne.

**Règle à retenir pour la suite du projet** : si un jour tu es tenté·e d'ajouter un
`fetch` vers `API_URL` directement dans un Client Component (`'use client'`), c'est un
signal qu'il faudrait plutôt une Server Action ou une Route Handler — pas seulement pour
éviter CORS, mais pour ne pas exposer l'URL de ton API ni le futur token dans le bundle
navigateur (voir la section sur `session.ts`).

### Authentification par téléphone, pas par email

`LoginRequestDto` côté Spring est `{ phoneNumber, password }` — ce backend n'authentifie
pas par email. C'est une décision produit (marché ivoirien, le numéro est l'identifiant
naturel), pas un détail technique à ignorer : `LoginFormSchema` (`definitions.ts`) et
`login-form.tsx` doivent tous les deux porter sur `phoneNumber`, pas `email`. Le `email`
n'existe que côté `signup` (en plus du téléphone).

### Authentification stateless : le token doit être renvoyé toi-même à chaque appel

La config Spring Security ici est stateless (JWT vérifié par un filtre à chaque
requête, pas de session serveur) : chaque appel à une route protégée doit porter le
token dans le header `Authorization: Bearer <token>`, sinon Spring Security le traite
comme anonyme.

`verifySession()` (`dal.ts`) applique déjà ce pattern pour `GET /auth/me`. Retiens-le
aussi pour plus tard, pour toute autre route protégée (ex: `/users/me`, ou n'importe
quelle donnée métier) appelée depuis `dal.ts` ou une autre Server Action :

```ts
const token = await getSession()
const res = await fetch(`${process.env.API_URL}/une-route-protegee`, {
  headers: { Authorization: `Bearer ${token}` },
})
```

Le cookie `httpOnly` géré par `session.ts` ne sert donc pas à authentifier la requête
*auprès de Spring Boot* (Spring ne le connaît pas, il n'est jamais envoyé jusqu'à lui
sous cette forme) : c'est un simple coffre-fort où Next.js range le JWT entre deux
requêtes du navigateur. C'est Next.js qui, à chaque fois qu'il a besoin de parler à
Spring Boot, ressort ce token du cookie et le pose dans le header `Authorization`.

### Le contrat d'erreur — référence complète

Vérifié par les tests automatisés du backend (`AuthControllerTest`, `AuthServiceTest`,
`GlobalExceptionHandlerTest` — suite verte), pas juste relu dans le code. Forme unique
pour **toute** erreur (`ErrorResponseDto`), produite par un `@RestControllerAdvice`
(`GlobalExceptionHandler`) :

```json
{
  "timestamp": "2026-08-18T13:26:44.723Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials",
  "path": "/auth/login",
  "fieldErrors": []
}
```

`fieldErrors` n'est peuplé (un objet `{ field, message }` par contrainte violée, peut
contenir plusieurs entrées pour le même `field`) que pour un échec de validation
`@Valid`. Les noms dans `field` correspondent aux clés attendues côté frontend
(`phoneNumber`, `password`, `firstname`, `lastname`, `email` — voir
`app/lib/definitions.ts`) : pas de mapping de nom à faire.

| Cas | Status | `message` | `fieldErrors` |
|---|---|---|---|
| `POST /auth/login` — mauvais téléphone/mot de passe | `401` | `"Invalid credentials"` | `[]` |
| `POST /auth/login` ou `/auth/signup` — champ invalide (`@NotBlank`, `@Size`, format téléphone/email) | `400` | `"Validation failed"` | rempli, un par champ/contrainte |
| `POST /auth/signup` — téléphone déjà enregistré | `409` | `"An account with this phone number already exists"` | `[]` |
| `POST /auth/signup` — email déjà enregistré | `409` | `"An account with this email already exists"` | `[]` |
| `POST /auth/logout` ou `GET /auth/me` — token absent/invalide/expiré/révoqué | `401` | message précis selon le cas (ex. `"Expired or invalid JWT token"`) | `[]` |
| `GET /auth/me` — compte supprimé après émission du token | `404` | `"user not found"` | `[]` |
| JSON malformé dans le corps de la requête | `400` | `"JSON parsing failed"` | `[]` |
| Erreur interne imprévue | `500` | `"An unexpected error occurred"` (jamais le détail réel, volontairement) | `[]` |

Messages de validation par défaut à anticiper dans le mapping (`fieldErrors[].message`) :
- `@NotBlank` → `"must not be blank"`
- `@Size(min=8, max=100)` sur `password` → `"size must be between 8 and 100"`
- `@IvoryCoastPhone` → `"Numéro de téléphone ivoirien invalide (ex : +2250701020304 ou 0701020304)"`
- `@StrictEmail` → `"The email address format is invalid."` ou `"Please provide a valid email address."` selon la contrainte qui échoue

**Conséquence pour `app/actions/auth.ts`** (`TODO(map-errors)`) : écris maintenant le
mapping fin par champ — la forme ci-dessus est stable et testée :
1. `const body = await res.json()` (uniquement dans le cas d'erreur).
2. Groupe `body.fieldErrors` par `field` en `Record<string, string[]>` — un même champ
   peut apparaître plusieurs fois, pousse chaque `message` dans le tableau du bon champ.
   `AuthFormState.errors` (`definitions.ts`) attend déjà `string[]` par champ, donc pas
   de fusion à inventer, juste grouper.
3. Retourne `{ errors: <ce mapping>, message: body.message }` — `message` sert de repli
   quand `fieldErrors` est vide (401 identifiants invalides, 409 doublon...).

`signup()` a besoin de EXACTEMENT la même logique de mapping que `login()` — voir la
remarque sur la factorisation possible (`TODO(review-2)` dans `app/actions/auth.ts`).

## Ordre d'implémentation et rôle de chaque fichier

### 1. `app/lib/definitions.ts` — la couche de validation

C'est l'équivalent d'un DTO Java avec des annotations Bean Validation, sauf qu'au lieu
d'annoter des champs de classe, on décrit un "schéma" avec la librairie **Zod** :

```ts
// à peu près l'équivalent de :
// public class LoginRequestDto {
//   @NotBlank private String phoneNumber; // validé région CI côté Spring
//   @Size(min = 8, max = 100) private String password;
// }
export const LoginFormSchema = z.object({
  phoneNumber: z.string().refine((v) => isValidPhoneNumber(v, 'CI'), {
    error: 'Numéro de téléphone ivoirien invalide.',
  }),
  password: z.string().min(8, { error: 'Be at least 8 characters long' }),
})
```

Différence importante avec Spring : ici, pas de classe + annotations + validation
automatique par le framework. Tu appelles toi-même `LoginFormSchema.safeParse(data)`
dans le code (tu verras ça à l'étape 4), et ça te retourne soit les données validées,
soit la liste d'erreurs — plus proche d'un appel manuel à un `Validator` Spring qu'un
`@Valid` automatique sur un paramètre de controller.

Pourquoi commencer par ce fichier ? Parce que tout le reste en dépend : le formulaire
affiche les erreurs qu'il définit, la Server Action s'en sert avant même de contacter
l'API. C'est comme écrire ton DTO de requête avant d'écrire le controller qui l'utilise.

`AuthFormState` est le type de la réponse "état + erreurs" que React utilisera pour
piloter l'UI (voir section suivante) — un concept qui n'a pas vraiment d'équivalent côté
Spring pur, car c'est lié à l'affichage réactif, pas à la validation elle-même.

### 2. `app/ui/auth/login-form.tsx` / `signup-form.tsx` — les formulaires

C'est du React que tu connais déjà en grande partie (JSX, `<form>`, `<input>`), avec
deux nouveautés Next.js/React récentes :

**`<form action={login}>`** : ce n'est **pas** un vrai POST HTTP classique vers une URL.
React intercepte la soumission et appelle directement la fonction `login` — une Server
Action (détaillée à l'étape 4) — comme un appel de fonction distant. Tu n'as **aucun
endpoint à déclarer toi-même côté Next.js pour ce formulaire** (contrairement à Spring où
tu écrirais forcément un `@PostMapping("/login")`) : Next.js génère ce tunnel client →
serveur automatiquement à partir de la directive `'use server'` qu'on verra à l'étape 4.

**`useActionState(login, undefined)`** (nouveau hook React, tu ne l'as probablement pas
encore croisé) : te donne trois valeurs :
- `state` : ce que `login` a renvoyé (les erreurs de validation, un message d'erreur)
- `action` : la fonction à passer à `action={...}` du `<form>` (pas `login` directement)
- `pending` : `true` pendant que la requête est en vol → désactive le bouton, affiche un spinner...

C'est l'équivalent front d'un état `LOADING / SUCCESS / ERROR` que tu gérerais
manuellement avec deux/trois `useState` dans du React "classique" — ici un seul hook
s'en charge.

**Sur la duplication** : les deux formulaires répètent le même trio label+input+erreurs
pour chaque champ. `app/ui/auth/form-field.tsx` extrait ce pattern en un composant
`<FormField label="..." id="..." name="..." errors={...} />` — le même réflexe que
factoriser une méthode privée commune entre deux `@Service` plutôt que copier-coller.
Un seul endroit à corriger si le style d'affichage d'erreur change un jour.

### 3. `app/(auth)/layout.tsx`, `login/page.tsx`, `signup/page.tsx` — le routing

Gros changement de paradigme par rapport à Spring : **pas de `@GetMapping("/login")` à
écrire**. Next.js utilise un **routing basé sur l'arborescence de fichiers** — le nom du
dossier devient directement le segment d'URL :

- `app/(auth)/login/page.tsx` → route `/login`
- `app/(auth)/signup/page.tsx` → route `/signup`

Les parenthèses `(auth)` créent un **route group** : un dossier qui sert à organiser le
code et partager `layout.tsx` (un peu comme un `@ControllerAdvice` ou une classe de
config commune) entre `login` et `signup`, mais qui **n'apparaît pas dans l'URL finale**.
Sans ce regroupement, il faudrait soit dupliquer le style/layout dans chaque page, soit
appliquer ce layout à tout le site.

### 4. `app/actions/auth.ts` — les Server Actions (le "controller")

C'est la pièce la plus proche d'un `@RestController` Spring : c'est ici, et *seulement*
ici, que le code a le droit de parler à ton API
(`fetch(process.env.API_URL + '/auth/login')`).

La ligne `'use server'` tout en haut du fichier est ce qui rend ça possible : elle dit à
Next.js "génère automatiquement le tunnel réseau pour que le navigateur puisse appeler
cette fonction, mais n'envoie jamais le code de cette fonction au navigateur". C'est un
peu comme si `@RestController` générait pour toi le endpoint HTTP *et* le client HTTP qui
l'appelle, sans que tu aies à écrire ni la route ni le `fetch`.

Pourquoi ne peut-on pas juste appeler l'API directement depuis `login-form.tsx` (le
Client Component) ? Parce que ce fichier-là est compilé en JS et envoyé tel quel au
navigateur : l'URL de ton API, une éventuelle clé, seraient visibles dans le code source
que n'importe qui peut inspecter (`F12` → Sources). La Server Action, elle, ne s'exécute
que côté serveur — le navigateur ne voit jamais son contenu, seulement "il existe une
fonction que je peux invoquer".

Séquence attendue dans `login` / `signup` (à écrire toi-même, voir les `TODO`) :
1. Valide les champs avec le schéma Zod de `definitions.ts` → retourne tôt si invalide
   (comme tu retournerais un `400 Bad Request` avant de toucher ta couche service).
2. Appelle ton API Spring Boot (`fetch`).
3. Si succès, stocke le token via `createSession()` (fichier suivant) — l'équivalent de
   poser un cookie de session dans la réponse HTTP.
4. `redirect()` vers la page suivante — équivalent d'un `HttpServletResponse.sendRedirect`.

### 5. `app/lib/session.ts` — le cookie de session

Ton API Spring Boot gère déjà l'authentification (vérif du mot de passe, génération du
token/JWT). Ce fichier a un rôle unique : conserver ce token côté navigateur **de façon
sécurisée**, entre deux requêtes — un peu comme Spring Session gère le cookie
`JSESSIONID`, sauf qu'ici c'est toi qui écris cette mécanique à la main.

Pourquoi un cookie `httpOnly` plutôt que `localStorage` (le réflexe le plus courant vu en
tuto frontend) ? Un cookie `httpOnly` est **invisible pour le JavaScript du navigateur**
— même si une faille XSS injectait du JS malveillant sur ton site, ce script ne pourrait
pas lire le token. `localStorage`, lui, est lisible par n'importe quel script de la page.
C'est le même réflexe de sécurité que configurer
`server.servlet.session.cookie.http-only=true` côté Spring Boot (activé par défaut,
d'ailleurs) : ici, comme tu gères le cookie toi-même, il faut explicitement mettre
l'option.

La ligne `import 'server-only'` en haut est un garde-fou : elle fait planter le build si
ce fichier est accidentellement importé depuis un Client Component (donc si son code
risquait de partir dans le bundle envoyé au navigateur).

### 6. `app/lib/dal.ts` — Data Access Layer

C'est le pattern `@Service` que tu utilises déjà côté Spring : un point d'entrée unique
pour "est-ce que l'utilisateur courant est authentifié, et qui est-il ?", au lieu de
relire le cookie et refaire la vérification à chaque endroit qui en a besoin — comme tu
centraliserais la lecture du `SecurityContextHolder` plutôt que de la disperser dans
chaque controller.

`GET /auth/me` existe côté backend (`Authorization: Bearer <token>` → `UserDto
{ firstname, lastname, phoneNumber, email, roles }`, `roles` sérialisé comme un tableau
de noms bruts de l'enum, ex. `["CUSTOMER"]`, valeurs possibles `CUSTOMER`/`PRO`/`ADMIN`)
— **option A retenue** : `verifySession()` appelle CET endpoint à chaque fois, plutôt
que de se contenter d'un décodage local du JWT. C'est une vraie vérification côté
serveur : un token expiré, corrompu, ou blacklisté après un logout (le décodage local ne
pouvait détecter aucun des trois cas) est rejeté par le backend lui-même. `app/lib/jwt.ts`
(décodage local) n'est donc plus utilisé ici — il reste utile uniquement à `session.ts`
(calcul de la date d'expiration du cookie). Pas de rate limiting côté backend sur cette
route, donc pas de coût réseau à anticiper même si `verifySession()` est appelée à chaque
visite de page protégée.

`cache()` (une fonction de React, pas de Next.js) mémorise le résultat **pour la durée
d'un seul rendu de page** : si plusieurs composants de la même page appellent
`verifySession()`, le décodage (ou, plus tard, l'appel réseau) ne se fait qu'une fois.
C'est l'équivalent d'un cache scope "une requête HTTP" — comme le premier niveau de
cache d'Hibernate qui vit le temps d'une `Session`/transaction, pas un cache partagé
entre requêtes (type Redis).

Pourquoi séparer ça de `proxy.ts` qui fait "presque pareil" ? Parce que le proxy tourne
sur *toutes* les requêtes, y compris des préchargements de liens qui n'affichent jamais
la page — même une fois `/auth/me` disponible, y appeler l'API à chaque fois serait un
appel réseau gâché. Le DAL, lui, n'est appelé que quand une page a réellement besoin des
données utilisateur.

### 7. `proxy.ts` — la protection de routes en amont

Dans les versions de Next.js que tu croiseras en tuto, ce fichier s'appelait
`middleware.ts`. Dans **cette version installée sur ce projet**, il a été renommé
`proxy.ts` (export `proxy()` au lieu de `middleware()`) — vérifié dans
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
Attention si tu suis un tuto en ligne qui n'est pas à jour sur ce point.

Il doit rester à la racine du projet (à côté de `app/`, pas dedans) et tourne **avant**
que la page ne soit rendue — l'équivalent exact d'un `Filter` Servlet enregistré sur
`/*`, ou d'une `SecurityFilterChain` Spring Security qui intercepte la requête avant
qu'elle n'atteigne le `DispatcherServlet`.

Rôle : rediriger vers `/login` si on tente d'accéder à une route protégée sans cookie de
session (comme un filtre qui renvoie une redirection si pas de header `Authorization`),
et inversement rediriger un utilisateur déjà connecté qui visite `/login`. Le `matcher`
exporté est l'équivalent des `antMatchers`/patterns d'URL sur lesquels tu appliques un
filtre Spring Security — ici, pour éviter de ralentir le chargement des fichiers
statiques (CSS, images).

## Pourquoi cet ordre précis ?

Chaque étape dépend de la précédente, comme tu ordonnerais DTO → Service → Controller →
Filtre en Spring :

1. Sans schéma de validation (1), impossible de savoir quelles erreurs afficher dans le
   formulaire (2).
2. Sans formulaire (2) fonctionnel, tu ne peux pas vérifier que la Server Action (4) est
   bien appelée.
3. Sans routing (3), il n'y a pas d'URL `/login` ou `/signup` à visiter.
4. La Server Action (4) a besoin de `createSession()` (5) pour terminer son travail.
5. Le DAL (6) a besoin que `session.ts` (5) existe pour lire le cookie.
6. `proxy.ts` (7) est la dernière pièce : elle protège des routes qui, pour l'instant,
   n'existent même pas encore dans ton app (ex: `/dashboard`) — pas utile avant que le
   reste fonctionne.

## Mini-primer TypeScript (pour ne pas être bloqué par la syntaxe)

TypeScript = JavaScript + un système de types **vérifié à la compilation seulement**
(comme les génériques Java à cause du *type erasure* : à l'exécution, il ne reste que du
JS, exactement comme à l'exécution il ne reste que du bytecode sans les infos de
générique). Tu n'as pas besoin de le maîtriser pour comprendre ce squelette, juste de
reconnaître ces quelques constructions :

| Syntaxe TS | Signification | Équivalent Java |
|---|---|---|
| `name: string` | le paramètre/champ `name` est de type `string` | `String name` |
| `name?: string` | champ optionnel, peut être `undefined` | proche d'un `Optional<String>`, mais vérifié seulement à la compilation |
| `string[]` | tableau de strings | `List<String>` ou `String[]` |
| `type AuthFormState = { ... } \| undefined` | soit un objet avec cette forme, soit `undefined` | proche d'un `Optional<AuthFormState>` |
| `Promise<T>` | valeur asynchrone qui résoudra en `T` | proche d'un `CompletableFuture<T>` |
| `LayoutProps<'/'>` | un type "générique" paramétré par une chaîne littérale (`'/'` est un type ici, pas juste une valeur) | proche de `LayoutProps<String>`, sauf que Java n'a pas de "type qui est une valeur littérale précise" — c'est une spécificité TS sans vrai équivalent Java |
| `async function foo() {}` | fonction asynchrone, s'utilise avec `await` | proche d'une méthode qui retourne un `CompletableFuture`, avec `await` ~ `.get()` mais non bloquant |

Le seul endroit un peu déroutant du squelette est `LayoutProps<'/'>` dans
`app/(auth)/layout.tsx` : Next.js génère automatiquement ce type à partir de ton
arborescence de fichiers (via `next dev`/`next typegen`) pour te donner l'auto-complétion
sur `params` et les enfants du layout — un peu comme si Spring générait un DTO de
requête typé automatiquement à partir de ta config de routes. Tu n'as jamais besoin de
l'écrire toi-même, seulement de le lire.

Ce tableau couvre la syntaxe TS générique. Les notions JS d'exécution dont tu as besoin
au fil de l'implémentation (`fetch`, `await`, `res.ok`, `res.json()`, `Date`,
`cookies()`, déstructuration d'objet...) sont expliquées directement en commentaire dans
les fichiers où elles apparaissent la première fois (`app/actions/auth.ts`,
`app/lib/session.ts`, `app/lib/dal.ts`, `proxy.ts`) — au moment où tu en as réellement
besoin plutôt que listées à l'avance ici.

## Glossaire rapide

| Terme | C'est quoi | Équivalent Spring Boot |
|---|---|---|
| Server Component | Composant rendu uniquement côté serveur | Code dans un `@Service`/`@RestController`, jamais visible du client |
| Client Component (`'use client'`) | Composant compilé en JS et exécuté dans le navigateur | Le JS/HTML réellement servi au navigateur |
| Server Action (`'use server'`) | Fonction appelable depuis un formulaire, exécutée côté serveur | Une méthode `@PostMapping`, sans avoir à écrire la route ni le client HTTP |
| `useActionState` | Hook React qui pilote état + erreurs + pending d'une Server Action | Les 2-3 `useState` (loading/error/data) que tu gérerais à la main |
| Route group `(nom)` | Dossier qui structure les routes sans apparaître dans l'URL | Regrouper des controllers sous une config commune sans changer le préfixe d'URL |
| `proxy.ts` (ex-`middleware.ts`) | Code qui tourne avant le rendu de chaque route | `Filter` Servlet / `SecurityFilterChain` |
| DAL (`dal.ts`) | Couche qui centralise l'accès aux données utilisateur authentifié | `@Service` d'auth + lecture du `SecurityContextHolder` |
| `cache()` (React) | Mémoïse un résultat pour la durée d'un rendu de page | Cache scope "une requête" (proche du 1er niveau de cache Hibernate) |
| Zod (`z.object({...})`) | Librairie de validation par schéma, appelée manuellement | Bean Validation (`@NotBlank`, `@Email`...) mais sans le déclenchement automatique par le framework |
