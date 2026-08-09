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
| `app/lib/definitions.ts` | ✅ fait | `LoginFormSchema`/`SignupFormSchema`/`AuthFormState` écrits et corrigés (email optionnel, firstname/lastname `.trim().min(1)`) |
| `app/ui/auth/form-field.tsx` | ✅ fait | Composant réutilisable extrait pour éviter la duplication label+input+erreurs |
| `app/ui/auth/login-form.tsx` | ✅ fait | Utilise `FormField` pour phoneNumber/password |
| `app/ui/auth/signup-form.tsx` | ✅ fait | Utilise `FormField` pour les 5 champs |
| `app/(auth)/layout.tsx` | ✅ fait | Carte centrée (design) |
| `app/(auth)/login/page.tsx` | ✅ fait | Titre + `LoginForm` + lien vers `/signup` |
| `app/(auth)/signup/page.tsx` | ✅ fait | Titre + `SignupForm` + lien vers `/login` |
| `app/globals.css` | ✅ fait | Styles de base (design) pour `input`/`label`/`button`/`h1`/`a`, variables de couleur clair/sombre |
| `app/lib/jwt.ts` | ✅ fait | Infra fournie telle quelle (`decodeJwt`), rien à écrire |
| `app/actions/auth.ts` | 🚧 en cours | `login()` : TODO(1) fait (validation Zod) — **reste TODO(2)/(3)/(4)** (appel API, session, redirect). `signup()` : rien fait, **TODO(1)/(2)/(3)**. `logout()` déjà complet. |
| `app/lib/session.ts` | ⬜ à faire | `getSession()`/`deleteSession()` déjà complets. **`createSession()` TODO(1)/(2) à écrire.** |
| `app/lib/dal.ts` | ⬜ à faire | **`verifySession()` TODO(1)/(2) à écrire.** `getUser()` dépend de ce que `verifySession()` retournera. |
| `proxy.ts` | ⬜ à faire | Listes de routes déjà faites. **TODO(1)/(2)/(3) à écrire** (lecture cookie + redirections). |
| `app/dashboard/page.tsx` | ⬜ à faire | **TODO(1)/(2) à écrire** (appel `verifySession()`, affichage). TODO(3) (bouton logout) a déjà un exemple quasi complet en commentaire. |

**Prochaine étape concrète** : `app/actions/auth.ts`, `login()` TODO(2) — le premier
appel `fetch()` du projet. Une fois `login()` entièrement écrite et testée dans le
navigateur (formulaire → cookie posé → redirection), le reste (`signup()`, `session.ts`,
`dal.ts`, `proxy.ts`, `dashboard/page.tsx`) réutilise les mêmes briques dans un ordre
logique — voir "Ordre d'implémentation" plus bas.

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
                          -> décode le JWT localement (PAS d'appel API : /auth/me
                             n'existe pas encore côté backend, voir plus bas)
```

Deux vérifications distinctes, volontairement :
- **`proxy.ts`** = comme un `Filter` Servlet ou un `HandlerInterceptor.preHandle`
  enregistré sur `/*` : il tourne sur *chaque* requête (y compris les préchargements de
  liens que Next.js déclenche tout seul). Il ne doit jamais appeler ton API — juste
  regarder si le cookie existe, comme un filtre qui vérifie juste la présence d'un
  header `Authorization` sans valider le JWT en base.
- **`dal.ts`** = l'endroit qui *devrait* jouer le rôle de
  `AuthenticationManager`/`SecurityContext` que tu interroges réellement dans un
  `@Service` — vérif solide, appelée seulement quand une page a vraiment besoin des
  données utilisateur. **En l'état actuel du backend, il n'y a pas d'endpoint à
  interroger** (pas de `/auth/me`), donc `dal.ts` ne peut que décoder le JWT localement.
  Voir la section "Limites connues actuelles du backend" plus bas — c'est une dette
  technique volontaire, pas l'architecture cible.

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

Ce squelette est écrit contre l'état **réel et actuel** de ton API, pas contre une
version idéalisée. Ces points sont amenés à changer — quand ils changeront, reviens sur
les fichiers concernés :

| Limite actuelle | Impact sur le frontend | Fichier concerné |
|---|---|---|
| Pas d'endpoint `/auth/me` | `dal.ts` décode le JWT localement au lieu d'appeler l'API pour vérifier le token | `app/lib/dal.ts`, `app/lib/jwt.ts` |
| Pas de route de logout exposée (la blacklist existe dans `AuthService` mais `AuthController` ne l'expose pas) | `logout()` supprime juste le cookie local, le token reste valide côté backend jusqu'à expiration | `app/actions/auth.ts` |
| Toutes les erreurs renvoient 401 avec un corps vide (bug confirmé, en cours de correction) | Message d'erreur générique uniquement, pas de distinction "mauvais mot de passe" vs "téléphone déjà pris" | `app/actions/auth.ts` |
| Pas de `@RestControllerAdvice` (conséquence du point précédent) | Pas de mapping d'erreurs par champ à écrire pour l'instant | `app/actions/auth.ts` |
| `jwt.expiration` = 5 minutes (valeur de dev) | Ne code aucune hypothèse UX sur cette durée précise (ex: "le token dure 5 min donc..."), décode toujours le vrai `exp` | `app/lib/session.ts` |
| Pas de refresh token | Pas de `updateSession()` à écrire pour ce MVP | `app/lib/session.ts` |
| CORS permissif (`*`) en dev, à resserrer avant prod | Un appel direct depuis le navigateur *fonctionnerait* en dev — ne t'y fie pas, respecte quand même la règle "jamais de fetch API depuis un Client Component" | `proxy.ts` / architecture générale |

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

Concrètement, **aujourd'hui** ça ne concerne encore aucun appel dans ce squelette,
puisque `/auth/login` et `/auth/signup` ne nécessitent pas d'être déjà authentifié, et
qu'il n'existe pas encore de route protégée à appeler depuis le frontend (pas de
`/auth/me`). Retiens le pattern pour plus tard, dès que tu consommeras une route
protégée (ex: `/users/me`, ou n'importe quelle donnée métier) depuis `dal.ts` ou une
autre Server Action :

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

### La forme des erreurs — actuellement cassée, ne code pas contre

En théorie, quand `@Valid` échoue sur un `@RequestBody` côté Spring
(`MethodArgumentNotValidException`), un `@RestControllerAdvice` renverrait quelque chose
comme :

```json
{
  "status": 400,
  "errors": [
    { "field": "email", "message": "must be a well-formed email address" },
    { "field": "password", "message": "size must be between 8 and 2147483647" }
  ]
}
```

**Mais ce n'est pas ce que fait le backend aujourd'hui.** Vérifié par curl : login
invalide, téléphone déjà pris au signup, et erreurs de validation renvoient tous
actuellement un **401 avec un corps vide** — bug confirmé côté backend, en cours de
correction, sans `@RestControllerAdvice` en place pour l'instant.

**Conséquence pour `app/actions/auth.ts`** : n'écris pas de mapping fin par champ tant
que ce n'est pas corrigé. Contente-toi de :

```ts
if (!res.ok) {
  return { message: 'Numéro ou mot de passe invalide.' }
}
```

Une fois le fix confirmé côté backend (codes cibles : 401 identifiants invalides, 409
téléphone déjà pris, 400 validation), reviens ici pour transformer la réponse au format
attendu par `AuthFormState` (`{ errors: { phoneNumber?: string[], ... } }`), un peu comme
un mapper entre un `ErrorResponse` Spring et un DTO destiné au frontend. Vérifie la forme
réelle (Postman, ou `console.log` temporaire dans la Server Action) avant d'écrire ce
mapping — ne le devine pas à l'avance.

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

**Cible architecturale** (ce que ferait `verifySession()` *si* `/auth/me` existait) :
rappeler l'API à chaque vérification pour confirmer que le token est toujours valide
côté serveur (pas expiré, pas blacklisté après un logout). **Réalité actuelle** : ce
endpoint n'existe pas, donc `verifySession()` décode le JWT localement via
`app/lib/jwt.ts` (`decodeJwt`) et vérifie juste que `exp` n'est pas dépassé — une
vérification purement locale, sans confirmation serveur. Le jour où `/auth/me` (ou
équivalent) existe, remplace ce décodage par un vrai `fetch` — voir "Limites connues
actuelles du backend" plus haut.

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
