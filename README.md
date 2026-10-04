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
- `js/athletes.js` : liste des skieurs (168 messieurs, 151 dames), générée à partir des classements FIS 2025-26. Ne pas modifier à la main.
- `js/fis-import.js` : lecture des pages FIS « Cup Standings » enregistrées en HTML, noms, identifiants, fusion avec alertes d'orthographe.
- `tools/build-athletes.js` : régénère `js/athletes.js` (`node tools/build-athletes.js messieurs.html dames.html`).
- `js/specialists.js` : liste des « spécialistes » de chaque course (bulle « Spécialistes » sous chaque course du desk). Généré, ne pas modifier à la main. Vide tant que l'import n'a pas été lancé (la bulle n'apparaît alors pas).
- `tools/specialists.js` : lecture des pages Firstskisport (calendrier, classement d'une course) et calcul des listes. `tools/make-specialists-browser.js` génère `tools/specialists-browser.js` ; `tools/build-specialists.js` écrit `js/specialists.js`.
- `js/demo.js` : joueurs, choix et résultats **fictifs** (les skieurs, eux, sont réels).
- `js/app.js`, `css/style.css` : interface. Typographies : Bricolage Grotesque et Instrument Sans (Google Fonts).

Tests : `node tests/game.test.js`, `node tests/fis-import.test.js` et `node tests/specialists.test.js`.

## Photos des skieurs

Déposer une photo par skieur dans `img/athletes/`, nommée avec l'identifiant du skieur : le nom sans accents, en minuscules, séparé par des tirets, au format `.jpg`. Exemples : `marco-odermatt.jpg`, `lara-gut-behrami.jpg`.

- Format conseillé : carré ou portrait, visage centré en haut, 300 × 300 px minimum.
- Sans fichier, l'interface affiche les initiales sur fond de couleur (bleu pour les messieurs, rouge pour les dames).
- La photo est en couleur pour un skieur déjà choisi et en noir et blanc s'il est encore libre (onglet « Athlètes pris »).

## Spécialistes d'une course (bulle info)

Sous chaque course, un bouton « Spécialistes » liste ceux qui réussissent le mieux à cette station dans cette discipline (messieurs ou dames).
Règle : **moyenne de points par départ** (un abandon vaut 0) sur les **5 dernières saisons**, **au moins 2 départs**, seulement parmi les skieurs de la liste du jeu (donc en activité). La moyenne par départ, et non le cumul, évite d'avantager ceux qui courent depuis longtemps ; les 2 départs minimum évitent qu'un seul exploit d'un jeune écrase la liste. Seules les courses de Coupe du monde comptent (pas les Jeux ni les Mondiaux). Les Mondiaux de Crans-Montana n'ont pas de bulle (pas d'historique).

Mise à jour (à refaire avant chaque desk, ~25 min) :
1. `node tools/make-specialists-browser.js` (option `--last 2027` pour inclure la saison 2026/27 en cours, `--seasons 5`) génère `tools/specialists-browser.js`.
2. Ouvrir une page de https://firstskisport.com/alpine/, coller le contenu de `tools/specialists-browser.js` dans la console du navigateur : le script lit les calendriers puis les classements des courses concernées (une requête toutes les 4 s, il patiente si le site demande de ralentir et reprend s'il est recollé dans le même onglet), et télécharge `fss-history.json`.
3. `node tools/build-specialists.js fss-history.json` écrit `js/specialists.js` et signale les courses sans liste (nouvelle station ou nom différent sur le site : ajouter un alias dans `HILL_ALIAS` de `tools/specialists.js`).
4. `git add js/specialists.js && git commit && git push`.

## À venir

Section Admin (import de liste avec arbitrage des orthographes, saisie et correction des résultats, attribution des tirages au sort), connexion Google et Firestore, remplacement du classement 2025-26 par la liste de départ WCSL, saisie et correction manuelle des résultats (ex aequo compris), import automatique des résultats, historique des résultats par piste.

Calendrier : Wikipédia FR (version du 12/09/2026) et programme officiel des Mondiaux de Crans-Montana. Heures de départ des courses de Coupe du monde : provisoires.

## Photos des skieurs
Photos FIS (médias) hébergées par firstskisport.com. `tools/add-fss.js` ajoute l'identifiant du site à `js/athletes.js` (158/168 messieurs, 142/151 dames ; les autres, surtout des athlètes marqués « # », gardent leurs initiales).
Sur ton ordinateur : `npm i sharp` puis `node tools/fetch-photos.js` remplit `img/athletes/<id>.jpg` (240 px). Ensuite `git add img && git commit && git push`.

### Photos via Wikimedia Commons (remplace Firstskisport, qui bloque les téléchargements)
`npm i sharp && node tools/fetch-wikidata-photos.js` (dans Codespaces) : cherche chaque skieur sur Wikidata (identifiant FIS, puis nom), enregistre `img/athletes/<id>.jpg`, `tools/photo-credits.json` et `credits.html`. Les photos déjà présentes ne sont pas écrasées : pour ajouter un portrait à la main, déposer `img/athletes/<id>.jpg`.

### Photos via Olympedia (skieurs passés par les Jeux 2014-2026)
`node tools/fetch-olympedia-photos.js --dry` compte les skieurs retrouvés ; sans `--dry`, télécharge les portraits (stockage d'images d'Olympedia) dans `img/athletes/`, sans écraser les photos déjà présentes, et met à jour `credits.html`.
