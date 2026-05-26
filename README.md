# RandoGPX — Générateur d'itinéraires rando & vélo

**Application Angular 21 + Angular Material** pour construire des programmes de randonnée pedestre ou cyclosportive en suivant une trace GPX.

## Parcours utilisateur

```
1. Préférences   →   2. Génération étapes   →   3. Revue / modifications   →   4. Repas & hébergement
```

**1. Écran préférences**
- Import GPX (drag & drop)
- Distance max / jour (km)
- Dénivelé max / étape (m)
- Heure de départ matinal
- Prix hébergement max (€)
- Prix repas max (€)
- Gare requise au départ / arrivée
- Ville de résidence (si gare)
- Date de début + nombre de jours

**2. Génération automatique (agent Hermes)**
Pour chaque étape :
- Distance, durée, dénivelé
- Trace GPX visualisée sur carte Leaflet
- Points touristiques principaux

**3. Revue et modifications**
- Drag & drop pour réorganiser les étapes
- Édition inline : distance, durée, stop inclus/exclus
- Aperçu temps réel sur la carte

**4. Hébergements & restauration (agent Hermes)**
- Repas midi et dîner : nom, type, prix, note
- Hébergement : nom, prix, photos, note

## Stack

| Technologie | Version |
|---|---|
| Angular | 21.2.x |
| Angular Material | 21.2.x |
| Leaflet | 1.9.x |
| Angular CLI | 21.2.x |
| API backend | Flask / SQLite (datatourisme.db) |

## Développement

```bash
git clone https://github.com/f80dev/rando-gpx.git
cd rando-gpx
npm install
ng serve
```

API backend (Flask) :
```bash
cd ../rando-gpx-api
python3 server.py
# → http://localhost:5000
```

## Architecture

```
src/app/
├── components/
│   ├── step-preferences/     # Écran 1 — préférences + import GPX
│   ├── step-review/           # Écran 2 — revue des étapes générées
│   ├── step-editor/          # Écran 3 — modification des étapes
│   ├── step-accommodation/   # Écran 4 — repas & hébergement
│   ├── gpx-map/              # Carte Leaflet avec trace GPX
│   └── accommodation-card/   # Carte hébergement / repas
├── services/
│   ├── communes.service.ts   # Appels API /api/trace/communes
│   ├── gpx-parser.service.ts # Parsing GPX
│   ├── itinerary.service.ts  # Modèle de données itinéraire
│   └── hermes-agent.service.ts # Communication agent IA
└── models/
    └── itinerary.model.ts    # Types TypeScript
```

## API endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/trace/communes` | Upload GPX → renvoie communes traversées |
| GET | `/api/health` | Health check |
| GET | `/api/commune/<insee>` | Détail d'une commune (POIs, attractivité) |
| GET | `/api/attractivite` | Classement des communes par score |
| GET | `/api/pois` | Recherche de POIs (lat/lon ou code_insee) |

---
*Propulsé par Hermes Agent — génération automatique d'itinéraires personnalisés.*
