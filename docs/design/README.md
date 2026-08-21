# Design de référence — kpata

Ce dossier contient le design sur lequel se baser pour tout ce qui touche à
l'apparence de l'app. Il vient d'un canvas Claude Design (zip "Refonte design
minimaliste Côte d'Ivoire", 2026-08-21).

## Contenu

- **`Kpata App.dc.html`** — le canvas : ouvre-le directement dans un navigateur
  pour voir les écrans dessinés (mobile, cadre 390×844) :
  1. Accueil client
  2. Découverte / recherche (si présent, voir le fichier)
  3. Dashboard pro
  4. Connexion
  5. Inscription
- **`_ds/modernist-.../styles.css`** — la feuille de style du design system
  "Modernist" : tokens (couleurs, police, espacements, ombres) + classes de
  composants (`.btn`, `.field`, `.input`, `.card`, `.tag`, etc.).
- **`_ds/modernist-.../readme.md`** — le guide d'utilisation de ce design
  system (quand utiliser quelle classe, règles à respecter/éviter).

## Ce qui a déjà été appliqué au projet réel

Les pages **Connexion**/**Inscription** de ce canvas ont déjà été portées dans
l'app (`app/globals.css`, `app/(auth)/**`, `app/ui/auth/**`) le 2026-08-21.
Avant de redessiner ces pages, regarde d'abord si ce qui existe déjà suffit.

Écarts volontaires entre le canvas et le code réel (à respecter si tu retouches
ces pages, pas des oublis) :

- **Rayon des coins** : le canvas est à 0px par défaut dans `styles.css`
  (système "Modernist" strict) mais le canvas de kpata les adoucit
  (`.frame .btn/.input/.card` → coins arrondis). `app/globals.css` a repris
  cette version adoucie directement dans les tokens (`--radius-sm/md/lg` =
  8/12/16px), pas la version stricte à 0.
- **Formulaire d'inscription** : le canvas n'a qu'un champ "Nom complet" et pas
  d'email. Le code garde `firstname`/`lastname`/`email` (optionnel) — c'est le
  contrat backend qui prime, pas le mockup.
- **"Mot de passe oublié ?"** : présent dans le canvas, absent du code — cette
  fonctionnalité n'existe pas encore côté backend.
- **Icônes Lucide** : utilisées dans le canvas, pas ajoutées au projet (nouvelle
  dépendance, pas encore demandée).
- **Police** : chargée via `next/font/google` (Archivo) dans `app/layout.tsx`,
  pas via le `@import` Google Fonts du `styles.css` d'origine — même police,
  chargement optimisé pour Next.js.

## Ce qui n'est pas encore fait

Les écrans "Accueil client" et "Dashboard pro" du canvas n'ont pas encore de
page Next.js équivalente — à utiliser comme référence quand ces pages seront
construites (`app/dashboard/page.tsx` notamment).

## Ce qui a été volontairement exclu de ce dossier

Le zip d'origine contenait aussi `uploads/stitch_modern_beauty_booking_portal/`
— un brouillon antérieur sous le nom "Lumiere" (anglais, palette différente,
pas de téléphone comme identifiant). Non pertinent, pas copié ici pour éviter
qu'un futur agent le confonde avec le design actuel.
