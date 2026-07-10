# Politique de confidentialité — Mainstage

Dernière mise à jour : 10 juillet 2026

Mainstage ("l'application") est éditée par Raphaël Ohanian ("nous", "le responsable de traitement"). Cette politique décrit quelles données sont collectées, pourquoi, et comment les exercer vos droits.

## 1. Données collectées

**Compte**
- Adresse email (création de compte, connexion)
- Mot de passe (stocké uniquement sous forme hashée, jamais en clair — géré par Supabase Auth)
- Si vous utilisez "Continuer avec Google" : votre identifiant Google, nom et photo de profil transmis par Google

**Profil**
- Nom affiché (pseudo)
- Photo de profil (optionnelle)
- Pays
- Langue préférée
- Genres musicaux favoris

**Contenu que vous créez dans l'app**
- Festivals marqués comme faits / prévus / en wishlist / favoris
- Années de participation et notes personnelles associées
- Avis publics (notes par catégorie et commentaires en texte libre)
- Artistes que vous suivez
- Relations d'amis avec d'autres utilisateurs

## 2. Pourquoi ces données sont collectées

- Faire fonctionner les fonctionnalités principales (suivi de festivals, avis, amis, recommandations d'artistes)
- Personnaliser l'affichage (langue, artistes suivis mis en avant dans les lineups)
- Générer des résumés automatiques des avis communautaires

## 3. Partage avec des tiers

Nous ne vendons aucune donnée. Certaines données transitent par des prestataires techniques, uniquement pour faire fonctionner les fonctionnalités correspondantes :

| Tiers | Donnée transmise | Finalité |
|---|---|---|
| **Supabase** (hébergeur base de données/auth) | Toutes les données ci-dessus | Hébergement et fonctionnement de l'application |
| **Anthropic (Claude API)** | Texte des commentaires d'avis publics | Génération des résumés IA des avis d'un festival |
| **Google** (optionnel) | Identifiant Google, si connexion via Google | Authentification |
| **Spotify** | Aucune donnée personnelle d'utilisateur | Les playlists publiques par festival sont générées une seule fois via un compte dédié ; les utilisateurs classiques ne se connectent jamais à Spotify |
| **Deezer** | Aucune donnée personnelle | Recherche publique de titres, sans authentification |

## 4. Durée de conservation

Vos données sont conservées tant que votre compte existe. Vous pouvez demander la suppression de votre compte et de toutes les données associées à tout moment (voir section 6).

## 5. Sécurité

- Toutes les données sont protégées par des règles d'accès strictes au niveau de la base de données (Row Level Security) : chaque utilisateur ne peut accéder qu'à ses propres données privées.
- Les mots de passe ne sont jamais stockés en clair.
- Les communications avec l'application sont chiffrées (HTTPS/TLS).

## 6. Vos droits

Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression, de limitation et de portabilité de vos données.

**Supprimer votre compte** : directement dans l'application (Profil → « Supprimer mon compte », suppression immédiate de toutes vos données), ou hors application en suivant [ces instructions](DELETE_ACCOUNT.md). Pour les autres droits, contactez-nous à l'adresse ci-dessous.

## 7. Mineurs

Mainstage n'est pas destinée aux enfants de moins de 16 ans. Nous ne collectons pas sciemment de données concernant des mineurs.

## 8. Contact

Pour toute question concernant cette politique ou vos données personnelles :
**raphael.ohanian@telecomnancy.net**

## 9. Modifications

Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut de ce document.
