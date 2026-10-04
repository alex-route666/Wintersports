# Wintersports

Fantasy league de sports d'hiver. Premier jeu : **Ski game**, sur la Coupe du monde de ski alpin 2026-2027.

## Règles de Ski game

- Une course = un choix de skieur ou de skieuse (avec un remplaçant possible).
- Un athlète ne peut être choisi **qu'une fois par desk**. Chute, abandon ou forfait : 0 point, et il reste « grillé » jusqu'au desk suivant.
- Le calendrier est découpé en 3 desks, eux-mêmes découpés en sessions. La deadline d'une session est le départ de sa première course.
- Barème de la Coupe du monde (100, 80, 60, 50, 45…, 1 point jusqu'à la 30e place). Géant et slalom : cumul des deux manches. Finales de Sun Valley ×2, Mondiaux ×3.
- Mondiaux (hors desks, huit épreuves individuelles, un seul moment de choix) : +200 si l'on a les deux vainqueurs d'une discipline, +400 pour les quatre vainqueurs messieurs ou dames. Les bonus se cumulent.
- Classements : général (le gros globe), par desk, et par discipline (les petits globes).

## Découpe retenue

| | Dates | Sessions | Courses |
|---|---|---|---|
| Desk 1 | 24 oct → 23 déc | 8 | 30 |
| Desk 2 | 28 déc → 31 jan | 8 | 29 |
| Mondiaux | 4 → 14 fév | 1 | 8 (×3) |
| Desk 3 | 20 fév → 25 mars | 5 | 24 (finales ×2) |

## État de la maquette

Page statique, sans connexion Google ni base de données pour l'instant.

- Ouvrir `index.html` dans un navigateur, ou le publier avec GitHub Pages.
- Le panneau « Atelier de la maquette » (en bas de page) charge des données de démonstration et permet de simuler une date.
- `js/data.js` : calendrier, desks, sessions, barème.
- `js/game.js` : règles du jeu (points, bonus, contrainte « une fois par desk », deadlines).
- `js/demo.js` : skieurs, joueurs, choix et résultats **fictifs**.
- `js/app.js`, `css/style.css` : interface. Typographies : Bricolage Grotesque et Instrument Sans (Google Fonts).

Tests des règles : `node tests/game.test.js`.

## Photos des skieurs

Déposer une photo par skieur dans `img/athletes/`, nommée avec l'identifiant du skieur : le nom sans accents, en minuscules, séparé par des tirets, au format `.jpg`. Exemples : `marco-odermatt.jpg`, `lara-gut-behrami.jpg`.

- Format conseillé : carré ou portrait, visage centré en haut, 300 × 300 px minimum.
- Sans fichier, l'interface affiche les initiales sur fond de couleur (bleu pour les messieurs, rouge pour les dames).
- La photo est en couleur pour un skieur déjà choisi et en noir et blanc s'il est encore libre (onglet « Athlètes pris »).

## À venir

Connexion Google et Firestore, import de la liste WCSL (avec arbitrage des changements d'orthographe), saisie et correction manuelle des résultats (ex aequo compris), import automatique des résultats, historique des résultats par piste.

Calendrier : Wikipédia FR (version du 12/09/2026) et programme officiel des Mondiaux de Crans-Montana. Heures de départ des courses de Coupe du monde : provisoires.
