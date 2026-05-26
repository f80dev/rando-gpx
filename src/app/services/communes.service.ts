import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../app.config';

export interface ScoreBreakdown {
  patrimoine: string;
  nature: string;
  loisirs: string;
  evenement: string;
  restauration: string;
  hebergement: string;
}

export interface TraceCommune {
  code_insee: string;
  code_postal: string;
  nom: string;
  population?: number;
  poi_count?: number;
  latitude?: number;
  longitude?: number;
  attractivite_score?: number;
  score_breakdown?: ScoreBreakdown;
}

export interface TraceCommunesResponse {
  total_gpx_points: number;
  sampled_points: number;
  count: number;
  communes: TraceCommune[];
  score_weights: Record<string, number>;
}

export interface WeightParams {
  w_patrimoine?: number;
  w_nature?: number;
  w_loisirs?: number;
  w_evenement?: number;
  w_restauration?: number;
  w_hebergement?: number;
}

@Injectable({ providedIn: 'root' })
export class CommunesService {
  private http = inject(HttpClient);

  getApiUrl(): string {
    return getApiBaseUrl();
  }

  /** Teste la connexion à l'API (GET /api/health) */
  ping(): Observable<{ status: string; db: string }> {
    return this.http.get<{ status: string; db: string }>(
      `${this.getApiUrl()}/api/health`
    );
  }

  /**
   * Envoie un fichier GPX à l'API et retourne les communes traversées
   * avec leur score d'attractivité (défaut: patrimoine×8).
   */
  getCommunes(
    gpxFile: File,
    weights?: WeightParams
  ): Observable<TraceCommunesResponse> {
    const baseUrl = this.getApiUrl();
    const params: string[] = [];

    if (weights) {
      if (weights.w_patrimoine != null)
        params.push(`w_patrimoine=${weights.w_patrimoine}`);
      if (weights.w_nature != null)
        params.push(`w_nature=${weights.w_nature}`);
      if (weights.w_loisirs != null)
        params.push(`w_loisirs=${weights.w_loisirs}`);
      if (weights.w_evenement != null)
        params.push(`w_evenement=${weights.w_evenement}`);
      if (weights.w_restauration != null)
        params.push(`w_restauration=${weights.w_restauration}`);
      if (weights.w_hebergement != null)
        params.push(`w_hebergement=${weights.w_hebergement}`);
    }

    const url = `${baseUrl}/api/trace/communes${params.length ? '?' + params.join('&') : ''}`;
    const formData = new FormData();
    formData.append('gpx', gpxFile);

    return this.http.post<TraceCommunesResponse>(url, formData);
  }
}