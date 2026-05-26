import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GpxData, ItineraryPreferences, Stage, Accommodation, Meal } from '../models/itinerary.model';

export interface HermesResponse {
  stages?: Stage[];
  accommodations?: Accommodation[];
  meals?: Meal[];
}

@Injectable({ providedIn: 'root' })
export class HermesAgentService {
  private http = inject(HttpClient);
  private apiUrl = environment.hermesApiUrl;
  private model = environment.hermesModel;

  /**
   * Étape 2 — Génère les étapes à partir du GPX et des préférences.
   */
  generateItinerary(
    gpxData: GpxData,
    preferences: ItineraryPreferences
  ): Observable<Stage[]> {
    const prompt = this.buildItineraryPrompt(gpxData, preferences);
    return this.callHermes(prompt).pipe(
      map((response) => response.stages ?? [])
    );
  }

  /**
   * Étape 4 — Génère hébergements et repas pour chaque étape.
   */
  fillAccommodationsAndMeals(
    stages: Stage[],
    preferences: ItineraryPreferences
  ): Observable<{ accommodations: Accommodation[]; meals: Meal[] }> {
    const prompt = this.buildAccommodationsPrompt(stages, preferences);
    return this.callHermes(prompt).pipe(
      map((response) => ({
        accommodations: response.accommodations ?? [],
        meals: response.meals ?? [],
      }))
    );
  }

  private callHermes(prompt: { system: string; user: string }): Observable<HermesResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map((res) => {
        const content = res.choices?.[0]?.message?.content ?? '';
        return this.parseJsonResponse(content);
      }),
      catchError((err) => {
        const message = err.error?.error?.message ?? 'Erreur de communication avec l_agent';
        return throwError(() => new Error(message));
      })
    );
  }

  private parseJsonResponse(content: string): HermesResponse {
    // Nettoie les fences markdown si présents
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    try {
      return JSON.parse(cleaned) as HermesResponse;
    } catch {
      throw new Error('Réponse JSON invalide de l_agent Hermes');
    }
  }

  private buildItineraryPrompt(
    gpxData: GpxData,
    prefs: ItineraryPreferences
  ): { system: string; user: string } {
    const system = `Tu es un expert en création d'itinéraires de randonné/vélo.
À partir des données GPX et des préférences utilisateur, génère un programme de ${prefs.numberOfDays} étapes.
Chaque étape doit être détaillée avec : nom, distance (km), durée (min),
dénivelé positif (m), dénivelé négatif (m), points GPS du segment,
points touristiques (nom, type, description courte, coordonnées).
Retourne un JSON valide (sans markdown) avec la structure exacte ci-dessous.

FORMAT DE RÉPONSE (JSON strict) :
{
  "stages": [
    {
      "id": "uuid",
      "name": "string",
      "distance": number,
      "duration": number,
      "elevationGain": number,
      "elevationLoss": number,
      "startPoint": [lon, lat],
      "endPoint": [lon, lat],
      "gpxCoordinates": [[lon, lat], ...],
      "pois": [
        {
          "name": "string",
          "type": "monument|viewpoint|nature|village|other",
          "coordinates": [lon, lat],
          "description": "string"
        }
      ]
    }
  ]
}`;

    const gpxSummary = `
Données GPX :
- Nom : ${gpxData.name}
- Distance totale : ${gpxData.totalDistance} km
- Dénivelé positif : ${gpxData.totalElevationGain} m
- Dénivelé négatif : ${gpxData.totalElevationLoss} m
- Nombre de points : ${gpxData.trackpoints.length}
- Premier point : [${gpxData.trackpoints[0]?.lon}, ${gpxData.trackpoints[0]?.lat}]
- Dernier point : [${gpxData.trackpoints[gpxData.trackpoints.length - 1]?.lon}, ${gpxData.trackpoints[gpxData.trackpoints.length - 1]?.lat}]

Préférences :
- Activité : ${prefs.activityType === 'bike' ? 'VTT/Vélo' : 'Randonnée pedestre'}
- Distance max/jour : ${prefs.maxDistancePerDay} km
- Dénivelé max/étape : ${prefs.maxElevationPerDay} m
- Heure de départ : ${prefs.departureTime}
- Date de début : ${prefs.startDate}
- Nombre de jours : ${prefs.numberOfDays}`;

    return { system, user: gpxSummary };
  }

  private buildAccommodationsPrompt(
    stages: Stage[],
    prefs: ItineraryPreferences
  ): { system: string; user: string } {
    const system = `Tu es un expert en planification de voyages.
Pour chaque étape du programme ci-dessous, propose un hébergement pour la nuit
et les repas (déjeuner, dîner) en fonction des préférences.
 PRIX MAX HÉBERGEMENT : ${prefs.maxAccommodationPrice} €/nuit
 PRIX MAX REPAS : ${prefs.maxMealPrice} €/repas
 BESOIN GARE : ${prefs.needTrainOnStartEnd ? 'Oui' : 'Non'}
 VILLE DE DÉPART : ${prefs.homeCity ?? 'Non précisée'}

FORMAT DE RÉPONSE (JSON strict) :
{
  "accommodations": [
    {
      "id": "uuid",
      "stageId": "uuid de l'étape associée",
      "name": "string",
      "pricePerNight": number,
      "coordinates": [lon, lat],
      "rating": number,
      "type": "hotel|gite|camping|airbnb",
      "trainStationNearby": boolean,
      "description": "string"
    }
  ],
  "meals": [
    {
      "id": "uuid",
      "stageId": "uuid",
      "slot": "lunch|dinner",
      "name": "string",
      "price": number,
      "coordinates": [lon, lat],
      "type": "restaurant|picnic|bistro",
      "description": "string"
    }
  ]
}`;

    const stagesList = stages
      .map(
        (s, i) =>
          `${i + 1}. ${s.name} — ${s.distance} km, ${s.elevationGain}m+, fin à [${s.endPoint[0]}, ${s.endPoint[1]}]`
      )
      .join('\n');

    return { system, user: `Programme d'étapes :\n${stagesList}` };
  }
}
