# kpata

Réservation de salons beauté & bien-être pour le marché ivoirien. Frontend
[Next.js](https://nextjs.org) (App Router), qui s'appuie sur un backend Spring
Boot séparé pour l'authentification et les données métier. L'authentification
se fait par **numéro de téléphone**, pas par email — décision produit pour le
marché ivoirien.

## État actuel

Le squelette d'authentification est terminé :

- **Connexion / inscription** (`/login`, `/signup`) — formulaires validés
  (Zod), erreurs mappées depuis le contrat d'erreur du backend
  (`ErrorResponseDto`), session posée dans un cookie `httpOnly`.
- **Déconnexion** — invalide le token côté backend puis nettoie la session
  locale.
- **Protection des routes** — un premier contrôle rapide (présence du cookie,
  `proxy.ts`) puis une vérification réelle côté serveur avant d'afficher une
  page protégée (`GET /auth/me`, `app/lib/dal.ts`).
- **Dashboard** (`/dashboard`) — affiche les infos du compte connecté
  (nom, téléphone, email, rôles) et le bouton de déconnexion.
- **Design** — l'identité visuelle "Modernist" (Archivo, rouge unique, coins
  adoucis) est appliquée aux pages ci-dessus.

Ce qui dépasse ce périmètre (réservations, profils pro, etc.) n'existe pas
encore.

Pour le détail fichier par fichier (rôle de chaque fichier, contrat d'erreur
du backend, décisions prises), voir [`docs/auth-architecture.md`](docs/auth-architecture.md).
Pour le design de référence, voir [`docs/design/`](docs/design/).

## Getting Started

Ce projet a besoin d'un backend Spring Boot qui tourne à côté (routes
`/auth/login`, `/auth/signup`, `/auth/logout`, `/auth/me`).

1. Crée un fichier `.env.local` à la racine avec l'URL de ce backend :

   ```
   API_URL=http://localhost:8080
   ```

2. Lance le serveur de développement :

   ```bash
   npm run dev
   ```

3. Ouvre [http://localhost:3000](http://localhost:3000).

## Compte de test

Le backend n'a pas de données de seed — ce compte a été créé à la main (via
`POST /auth/signup`) pour tester rapidement sans repasser par `/signup` :

| Champ | Valeur |
|---|---|
| Téléphone | `0701020304` |
| Mot de passe | `password123` |

Connecte-toi directement via [`/login`](http://localhost:3000/login). Ce
compte vit dans la base locale du backend : s'il est réinitialisé, recrée-le
via [`/signup`](http://localhost:3000/signup) avec ces mêmes valeurs (prénom
Aïcha, nom Koné, email `aicha@example.com`).
