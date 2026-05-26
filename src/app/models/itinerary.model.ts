// ─── Types de base ────────────────────────────────────────────

export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ─── GPX ─────────────────────────────────────────────────────

export interface GpxData {
  name: string;
  trackpoints: TrackPoint[];
  totalDistance: number;       // km
  totalElevationGain: number;  // m
  totalElevationLoss: number;  // m
  bounds: LatLngBounds;
}

// ─── Préférences utilisateur ──────────────────────────────────

export type ActivityType = 'bike' | 'hike';

export interface ItineraryPreferences {
  activityType?: ActivityType;
  maxDistancePerDay?: number;       // km
  maxElevationPerDay?: number;       // m
  departureTime?: string;            // HH:mm
  maxAccommodationPrice?: number;    // EUR
  maxMealPrice?: number;             // EUR
  needTrainOnStartEnd?: boolean;
  homeCity?: string;
  startDate?: string;                // ISO date
  numberOfDays?: number;
}

// ─── Étapes ──────────────────────────────────────────────────

export type PoiType = 'monument' | 'viewpoint' | 'nature' | 'village' | 'other';

export interface POI {
  name: string;
  type: PoiType;
  coordinates: [number, number]; // [lon, lat]
  description?: string;
}

export interface Stage {
  id: string;
  name: string;
  distance: number;           // km
  duration: number;          // minutes
  elevationGain: number;     // m
  elevationLoss: number;     // m
  startPoint: [number, number];
  endPoint: [number, number];
  gpxCoordinates: [number, number][];
  pois: POI[];
  lunchSuggestionId?: string;
  dinnerSuggestionId?: string;
  accommodationId?: string;
  disabled?: boolean;
}

// ─── Hébergements ─────────────────────────────────────────────

export type AccommodationType = 'hotel' | 'gite' | 'camping' | 'airbnb';

export interface Accommodation {
  id: string;
  stageId: string;
  name: string;
  pricePerNight: number;
  coordinates: [number, number];
  address?: string;
  rating: number;             // 1-5
  type: AccommodationType;
  trainStationNearby: boolean;
  description?: string;
}

// ─── Repas ───────────────────────────────────────────────────

export type MealType = 'restaurant' | 'picnic' | 'bistro';
export type MealSlot = 'lunch' | 'dinner';

export interface Meal {
  id: string;
  stageId: string;
  slot: MealSlot;
  name: string;
  price: number;
  coordinates: [number, number];
  type: MealType;
  description?: string;
}

// ─── État global ─────────────────────────────────────────────

export interface ItineraryState {
  gpxData: GpxData | null;
  preferences: Partial<ItineraryPreferences>;
  stages: Stage[];
  accommodations: Accommodation[];
  meals: Meal[];
  currentStep: number;
}