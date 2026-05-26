import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  priceLevel: number;
  types: string[];
  photoUrl: string | null;
  openingHours: boolean | null;
  website: string | null;
  phone: string | null;
}

export interface TextSearchResult {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  priceLevel: number;
  types: string[];
  photoUrl: string | null;
  isOpen: boolean | null;
  website: string | null;
  phone: string | null;
  userRatingsTotal: number;
  placeId: string;
  ratingText?: string; // "Budget", "Mid Range", "Upper Mid Range", "Upscale", "Luxury"
}

export type PlaceType = 'restaurant' | 'hotel' | 'cafe' | 'bar' | 'bakery' | 'grocery_or_supermarket' | 'lodging';

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private http = inject(HttpClient);
  private apiKey = environment.googlePlacesApiKey;
  private baseUrl = 'https://places.googleapis.com/v1';

  /**
   * Rechercher des lieux par mot-clé autour d'un point GPS.
   * radius en mètres (max 50000).
   */
  searchNearby(
    location: { lat: number; lng: number },
    keyword: string,
    type?: PlaceType,
    radius: number = 5000
  ): Observable<PlaceResult[]> {
    const params = new HttpParams()
      .set('includedType', type ?? '')
      .set('locationRestriction.circle.center.latitude', location.lat.toString())
      .set('locationRestriction.circle.center.longitude', location.lng.toString())
      .set('locationRestriction.circle.radius', radius.toString())
      .set('maxResultCount', '20')
      .set('keyword', keyword);

    return this.http
      .post<any>(`${this.baseUrl}/places:searchNearby`, {}, { params })
      .pipe(map((res) => this.mapResults(res.places ?? [])));
  }

  /**
   * Recherche textuelle : "restaurant near 46.6, 2.5"
   */
  textSearch(query: string, location?: { lat: number; lng: number }): Observable<TextSearchResult[]> {
    let params = new HttpParams().set('textQuery', query).set('maxResultCount', '20');
    if (location) {
      params = params
        .set('locationBias.circle.center.latitude', location.lat.toString())
        .set('locationBias.circle.center.longitude', location.lng.toString())
        .set('locationBias.circle.radius', '50000');
    }
    return this.http
      .post<any>(`${this.baseUrl}/places:searchText`, {}, { params })
      .pipe(map((res) => this.mapTextSearchResults(res.places ?? [])));
  }

  /**
   * Rechercher restaurants et hôtels dans un rayon autour d'un point GPS.
   */
  searchInArea(
    center: { lat: number; lng: number },
    radiusMeters: number,
    type: PlaceType = 'restaurant',
    maxResults = 20
  ): Observable<PlaceResult[]> {
    return this.searchNearby(center, '', type, radiusMeters);
  }

  private mapResults(places: any[]): PlaceResult[] {
    return places.map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      location: {
        lat: p.location?.latitude ?? 0,
        lng: p.location?.longitude ?? 0,
      },
      rating: p.rating ?? 0,
      priceLevel: p.priceLevel ?? -1,
      types: p.types ?? [],
      photoUrl: null,
      openingHours: null,
      website: null,
      phone: null,
    }));
  }

  private mapTextSearchResults(places: any[]): TextSearchResult[] {
    return places.map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      location: {
        lat: p.location?.latitude ?? 0,
        lng: p.location?.longitude ?? 0,
      },
      rating: p.rating ?? 0,
      priceLevel: p.priceLevel ?? -1,
      types: p.types ?? [],
      photoUrl: p.photos?.[0] ? this.buildPhotoUrl(p.photos[0].name) : null,
      isOpen: p.accessibilityOptions?.worksOnWeekends ? null : null, // isOpen requires extra API call
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      userRatingsTotal: p.userRatingCount ?? 0,
      ratingText: p.priceLevelText?.text,
    }));
  }

  private buildPhotoUrl(photoName: string): string {
    // La Photo API utilise le nom de la photo retourné par Google
    // Format: places/PHOTO_ID/photos/PHOTO_NAME
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${this.apiKey}`;
  }

  /**
   * Récupérer les détails complets d'un lieu (horaires, phone, website, photos).
   */
  getPlaceDetails(placeId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/places/${placeId}?fields=id,displayName,formattedAddress,location,rating,priceLevel,types,regularOpeningHours,websiteUri,nationalPhoneNumber,photos,userRatingCount`,
      {}
    );
  }
}